import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { LibraryReachList } from '@ValenceScreens/components/LibraryReachList/LibraryReachList';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { childQueries } from '@ValenceClient/query/childQueries';
import { setChildPin } from '@ValenceClient/account/fetchChildren';
import { setCeiling, setLibraryAccess } from '@ValenceClient/admin/fetchLibraryAccess';
import { CHILD_PIN } from '@ValenceContracts/schemas/ChildAccount';
import type { LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { ChildRowProps } from './ChildRow.types';
import { say } from '@ValenceI18n/say';

const NO_SHELVES: LibraryReach[] = [];

/**
 * Saves what changed about the libraries a child may see, one library at a time, stopping at the
 * first refusal.
 *
 * @param userId - The child's account.
 * @param was - The libraries as the server holds them.
 * @param draft - The libraries as they would be saved.
 * @returns The first refusal, or null where everything was saved.
 */
const saveShelves = async (
  userId: string,
  was: readonly LibraryReach[],
  draft: readonly LibraryReach[],
): Promise<Refusal> => {
  for (const shelf of draft) {
    const original = was.find((candidate) => candidate.id === shelf.id);

    if (original === undefined) {
      continue;
    }

    if (original.mayView !== shelf.mayView) {
      const refused = await setLibraryAccess(userId, shelf.id, shelf.mayView);

      if (refused !== null) {
        return refused;
      }
    }

    if (
      shelf.mayView &&
      (original.maximumAge !== shelf.maximumAge || original.allowsUnrated !== shelf.allowsUnrated)
    ) {
      const refused = await setCeiling(
        userId,
        shelf.id,
        shelf.maximumAge === null
          ? null
          : { maximumAge: shelf.maximumAge, allowsUnrated: shelf.allowsUnrated },
      );

      if (refused !== null) {
        return refused;
      }
    }
  }

  return null;
};

/**
 * One child's account: the PIN they sign in with, and the libraries they may see and the age each
 * is limited to, opened on asking.
 *
 * @param child - The child.
 */
const ChildRow = ({ child }: ChildRowProps) => {
  const cache = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isSavingShelves, setIsSavingShelves] = useState(false);
  const access = useQuery({ ...adminQueries.libraryAccess(child.id), enabled: isOpen });
  const shelves = access.data ?? NO_SHELVES;
  const [draft, setDraft] = useState<LibraryReach[]>(shelves);
  const isPinFine = CHILD_PIN.test(pin);
  const isChanged = JSON.stringify(draft) !== JSON.stringify(shelves);

  useEffect(() => {
    setDraft(shelves);
  }, [shelves]);

  const savePin = async (next: string | null) => {
    setIsSavingPin(true);

    const refused = await setChildPin(child.id, next);

    setIsSavingPin(false);

    if (refused !== null) {
      notify.failed(refused.message);

      return;
    }

    setPin('');
    await cache.invalidateQueries({ queryKey: childQueries.key });
  };

  const saveLibraries = async () => {
    setIsSavingShelves(true);

    const refused = await saveShelves(child.id, shelves, draft);

    setIsSavingShelves(false);

    if (refused !== null) {
      notify.failed(refused.message);
    }

    await cache.invalidateQueries({ queryKey: adminQueries.libraryAccess(child.id).queryKey });
  };

  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1 truncate font-medium text-text">{child.name}</span>

        <Badge size="sm">
          {child.hasPin
            ? say('screens.accountArea.childrenPanel.signsInWithAPin')
            : say('screens.accountArea.childrenPanel.signsInWithATap')}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          aria-expanded={isOpen}
          label={say('common.changeName', { name: child.name })}
          onClick={() => {
            setIsOpen((was) => !was);
          }}
        >
          {isOpen ? say('common.close') : say('common.change')}
        </Button>
      </div>

      {!isOpen ? null : (
        <div className="flex flex-col gap-5">
          <form
            noValidate
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void savePin(pin);
            }}
          >
            <TextField
              label={say('screens.accountArea.childrenPanel.newPin')}
              type="password"
              value={pin}
              onValueChange={setPin}
              autoComplete="off"
              className="w-40"
              {...(pin === '' || isPinFine
                ? {}
                : { error: say('screens.accountArea.childrenPanel.fourToEightDigits') })}
            />

            <Button type="submit" variant="secondary" isLoading={isSavingPin} disabled={!isPinFine}>
              {say('screens.accountArea.childrenPanel.setPin')}
            </Button>

            {!child.hasPin ? null : (
              <Button
                variant="ghost"
                isLoading={isSavingPin}
                onClick={() => {
                  void savePin(null);
                }}
              >
                {say('screens.accountArea.childrenPanel.takeThePinAway')}
              </Button>
            )}
          </form>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text">{say('common.libraries')}</p>

            <LibraryReachList
              shelves={draft}
              whose={child.name}
              onChange={(shelfId, changes) => {
                setDraft((current) =>
                  current.map((shelf) => (shelf.id === shelfId ? { ...shelf, ...changes } : shelf)),
                );
              }}
            />

            <div className="flex justify-end pt-2">
              <Button
                variant="confirm"
                isLoading={isSavingShelves}
                disabled={!isChanged}
                label={say('screens.accountArea.childrenPanel.saveNameSLibraries', {
                  name: child.name,
                })}
                onClick={() => {
                  void saveLibraries();
                }}
              >
                {say('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

ChildRow.displayName = 'ChildRow';

export { ChildRow };

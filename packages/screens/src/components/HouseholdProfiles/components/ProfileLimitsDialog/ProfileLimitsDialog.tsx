import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronsUpDown as ChevronsUpDownIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { changeProfiles } from '@ValenceClient/profiles/changeProfiles';
import { describeCeiling } from '@ValenceContracts/schemas/LibraryAccess';
import { AGE_CHOICES } from '@ValenceScreens/components/AdminArea/ageChoices';
import type { ProfileLibrary } from '@ValenceContracts/schemas/ProfileLibraries';
import type { ProfileLimitsDialogProps } from './ProfileLimitsDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * The ages a profile may be held to in a library: any of them where its account is not held to one
 * there, or only those at or below the account's own, since a profile can only be narrowed.
 *
 * @param shelf - The library, as the profile and its account stand in it.
 * @returns The choices.
 */
const agesFor = (shelf: ProfileLibrary) =>
  AGE_CHOICES.filter(
    (choice) =>
      choice.id === 'none' ||
      shelf.accountMaximumAge === null ||
      Number.parseInt(choice.id, 10) <= shelf.accountMaximumAge,
  );

/**
 * Narrows what one profile may watch: which of its account's libraries it sees, and up to what age
 * in each. Each change is kept as it is made. The account's own limits still apply on top.
 *
 * @param profile - Whose limits, or nobody while it is closed.
 * @param accountId - Whose account, where an administrator is looking at somebody else's.
 * @param onClose - Told to put it away.
 */
const ProfileLimitsDialog = ({ profile, accountId, onClose }: ProfileLimitsDialogProps) => {
  const cache = useQueryClient();
  const [isChanging, setIsChanging] = useState<string | null>(null);
  const shelves = useQuery({
    ...profileQueries.libraries(profile?.id ?? '', accountId),
    enabled: profile !== null,
  });

  const change = async (
    shelf: ProfileLibrary,
    path: string,
    method: 'PUT' | 'DELETE',
    body?: object,
  ) => {
    if (profile === null) {
      return;
    }

    setIsChanging(shelf.id);

    const refused = await changeProfiles({
      path: `/${profile.id}/libraries/${shelf.id}${path}`,
      method,
      ...(body === undefined ? {} : { body }),
      ...(accountId === undefined ? {} : { accountId }),
    });

    setIsChanging(null);

    if (refused !== null) {
      notify.failed(refused);

      return;
    }

    await cache.invalidateQueries({ queryKey: profileQueries.key });
  };

  const name = profile?.name ?? '';
  const title = say('screens.householdProfiles.whatNameCanWatch', { name });

  return (
    <Dialog label={title} isOpen={profile !== null} onClose={onClose}>
      <DialogTitle
        title={title}
        detail={say('screens.householdProfiles.theAccountsOwnLimitsStillApply')}
      />

      <DialogContent>
        {shelves.data === undefined ? (
          <Spinner size="sm" label={say('common.loading')} />
        ) : shelves.data.length === 0 ? (
          <p className="text-sm text-text-muted">{say('common.thereAreNoLibrariesYet')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shelves.data.map((shelf) => (
              <li key={shelf.id} className="flex flex-wrap items-center gap-2">
                <Button
                  variant={shelf.mayView ? 'glossy' : 'ghost'}
                  size="sm"
                  aria-pressed={shelf.mayView}
                  isLoading={isChanging === shelf.id}
                  label={
                    shelf.mayView
                      ? say('screens.adminArea.accountsPanel.keepNameFromName2', {
                          name: shelf.name,
                          name2: name,
                        })
                      : say('screens.adminArea.accountsPanel.letNameSeeName2', {
                          name,
                          name2: shelf.name,
                        })
                  }
                  onClick={() => {
                    void change(shelf, '', shelf.mayView ? 'DELETE' : 'PUT');
                  }}
                >
                  {shelf.name}
                </Button>

                {!shelf.mayView ? null : (
                  <OptionMenu
                    label={say('screens.adminArea.accountsPanel.ageLimitInNameForName2', {
                      name: shelf.name,
                      name2: name,
                    })}
                    groups={[
                      {
                        name: say('common.nothingAbove'),
                        selectedId: shelf.maximumAge === null ? 'none' : String(shelf.maximumAge),
                        onSelect: (id) => {
                          void (id === 'none'
                            ? change(shelf, '/ceiling', 'DELETE')
                            : change(shelf, '/ceiling', 'PUT', {
                                maximumAge: Number.parseInt(id, 10),
                                allowsUnrated: shelf.allowsUnrated,
                              }));
                        },
                        options: agesFor(shelf),
                      },
                    ]}
                    trigger={
                      <>
                        <span className="truncate">{describeCeiling(shelf.maximumAge)}</span>

                        <Icon of={ChevronsUpDownIcon} size={14} className="shrink-0" />
                      </>
                    }
                    triggerShape="field"
                    align="end"
                    className="w-40 max-w-full"
                  />
                )}

                {shelf.maximumAge === null ? null : (
                  <Button
                    variant={shelf.allowsUnrated ? 'glossy' : 'ghost'}
                    size="sm"
                    aria-pressed={shelf.allowsUnrated}
                    label={say(
                      'screens.adminArea.accountsPanel.allowUncertificatedThingsInNameFor',
                      {
                        name: shelf.name,
                        name2: name,
                      },
                    )}
                    onClick={() => {
                      void change(shelf, '/ceiling', 'PUT', {
                        maximumAge: shelf.maximumAge ?? 0,
                        allowsUnrated: !shelf.allowsUnrated,
                      });
                    }}
                  >
                    {say('common.allowUnrated')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>

      <DialogFooter dismiss={{ label: say('common.done'), onChoose: onClose }} />
    </Dialog>
  );
};

ProfileLimitsDialog.displayName = 'ProfileLimitsDialog';

export { ProfileLimitsDialog };

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { createCollection, updateCollection } from '@ValenceClient/collections/fetchCollections';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { draftOfTitleRules } from '@ValenceClient/smart/draftOfTitleRules';
import { titleRulesOf } from '@ValenceClient/smart/titleRulesOf';
import { SmartRulesEditor } from '@ValenceScreens/components/SmartRulesEditor/SmartRulesEditor';
import type { CollectionEditDialogProps } from './CollectionEditDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Makes a collection, or changes one: its name, what it gathers, and whether the order it is in
 * means something — a saga watched in release order, rather than a director's films in any order.
 * A smart collection is asked for its rules instead. Somebody who looks after the libraries says
 * whether a new one is for everyone or for themselves; anybody else's is their own, and their own
 * may be shared with everyone.
 *
 * @param isOpen - Whether it is showing.
 * @param onClose - Closes it.
 * @param collection - The collection being changed, or nothing to make a new one.
 * @param startsWith - What a new one holds from the start, such as the title it was made from.
 * @param onSaved - Called with the collection once it has been made or changed.
 * @param isSmart - Whether a new one fills itself from rules.
 * @param letsChooseSmart - Whether a new one may be either kind, smart to begin with.
 * @param startsWithRules - The rules a new smart one starts from, such as the filters it was made
 *   from.
 */
const CollectionEditDialog = ({
  isOpen,
  onClose,
  collection,
  startsWith = [],
  onSaved,
  isSmart: isNewSmart = false,
  letsChooseSmart = false,
  startsWithRules,
}: CollectionEditDialogProps) => {
  const cache = useQueryClient();
  const { may } = useWhatIMayDo();
  const mayManage = may('library.edit');
  const [name, setName] = useState(collection?.name ?? '');
  const [description, setDescription] = useState(collection?.description ?? '');
  const [isOrdered, setIsOrdered] = useState(collection?.isOrdered ?? false);
  const [rules, setRules] = useState(() =>
    draftOfTitleRules(collection?.rules ?? startsWithRules ?? null),
  );
  const [isForEveryone, setIsForEveryone] = useState(false);
  const [isSmartChosen, setIsSmartChosen] = useState(true);
  const [isShared, setIsShared] = useState(collection?.isShared ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const isNew = collection === undefined;
  const isSmart = collection?.isSmart ?? (letsChooseSmart ? isSmartChosen : isNewSmart);
  const isMine = collection?.isMine === true;
  const hasRulesItReads = collection === undefined || collection.rules !== null;
  const title = isSmart
    ? isNew
      ? say('common.newSmartCollection')
      : say('common.editSmartCollection')
    : isNew
      ? say('common.newCollection')
      : say('screens.collectionEditDialog.editCollection');

  const [wasOpen, setWasOpen] = useState(isOpen);

  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);

    if (isOpen) {
      setName(collection?.name ?? '');
      setDescription(collection?.description ?? '');
      setIsOrdered(collection?.isOrdered ?? false);
      setRules(draftOfTitleRules(collection?.rules ?? startsWithRules ?? null));
      setIsForEveryone(false);
      setIsSmartChosen(true);
      setIsShared(collection?.isShared ?? false);
      setProblem(null);
      setIsChecked(false);
    }
  }

  const save = async () => {
    const trimmed = name.trim();
    const described = description.trim() === '' ? null : description.trim();

    if (trimmed === '') {
      setProblem(say('screens.collectionEditDialog.aCollectionNeedsAName'));

      return;
    }

    const smartRules = isSmart && hasRulesItReads ? titleRulesOf(rules) : null;

    if (isSmart && hasRulesItReads && smartRules === null) {
      setIsChecked(true);

      return;
    }

    setIsSaving(true);

    const saved = isNew
      ? ((
          await createCollection({
            name: trimmed,
            description: described,
            isOrdered,
            ...(smartRules === null
              ? startsWith.length === 0
                ? {}
                : { entries: [...startsWith] }
              : { rules: smartRules, isPersonal: !(mayManage && isForEveryone) }),
          })
        )?.id ?? null)
      : (await updateCollection(collection.id, {
            name: trimmed,
            description: described,
            isOrdered,
            ...(smartRules === null ? {} : { rules: smartRules }),
            ...(isMine ? { isShared } : {}),
          }))
        ? collection.id
        : null;

    setIsSaving(false);

    if (saved === null) {
      setProblem(
        isNew
          ? say('screens.collectionEditDialog.thatCollectionCouldNotBeMade')
          : say('common.thatCouldNotBeSaved'),
      );

      return;
    }

    void cache.invalidateQueries({ queryKey: collectionQueries.key });
    onSaved?.(saved);
    onClose();
  };

  return (
    <Dialog label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle title={title} />

      <DialogContent className="flex flex-col gap-4">
        <TextField
          label={say('common.name')}
          value={name}
          hasFocusOnMount
          {...(problem === null ? {} : { error: problem })}
          onValueChange={(next) => {
            setName(next);
            setProblem(null);
          }}
        />

        <TextField
          label={say('common.description')}
          value={description}
          placeholder={say('screens.collectionEditDialog.whatTheseHaveInCommon')}
          onValueChange={setDescription}
        />

        {isNew && letsChooseSmart ? (
          <div className="flex flex-col gap-1">
            <Switch
              label={say('common.smartCollection')}
              isOn={isSmartChosen}
              onToggle={() => {
                setIsSmartChosen((was) => !was);
              }}
            />
            <p className="text-[0.8125rem] text-text-muted">
              {say('common.fillsItselfFromItsRules')}
            </p>
          </div>
        ) : null}

        {isSmart && isNew && mayManage ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-text">
              {say('screens.smartRules.whoSeesIt')}
            </span>
            <SegmentedRow
              label={say('screens.smartRules.whoSeesIt')}
              size="sm"
              items={[
                { id: 'me', label: say('screens.smartRules.justMe') },
                { id: 'everyone', label: say('common.everyone') },
              ]}
              value={isForEveryone ? 'everyone' : 'me'}
              onSelect={(next) => {
                setIsForEveryone(next === 'everyone');
              }}
            />
          </div>
        ) : null}

        {isMine ? (
          <Switch
            label={say('screens.smartRules.shareItWithEveryone')}
            isOn={isShared}
            onToggle={() => {
              setIsShared((was) => !was);
            }}
          />
        ) : null}

        {isSmart && !hasRulesItReads ? (
          <p className="text-[0.8125rem] text-text-muted">
            {say('common.theseRulesComeFromANewerValence')}
          </p>
        ) : isSmart ? (
          <SmartRulesEditor of="titles" draft={rules} isChecked={isChecked} onChange={setRules} />
        ) : (
          <>
            <Switch
              label={say('common.theOrderMatters')}
              isOn={isOrdered}
              onToggle={() => {
                setIsOrdered((was) => !was);
              }}
            />

            <p className="-mt-2 text-[0.8125rem] text-text-muted">
              {say('screens.collectionEditDialog.forASagaWatchedInOrder')}
            </p>
          </>
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: isNew ? say('common.create') : say('common.save'),
          onChoose: () => {
            void save();
          },
          isLoading: isSaving,
        }}
      />
    </Dialog>
  );
};

CollectionEditDialog.displayName = 'CollectionEditDialog';

export { CollectionEditDialog };

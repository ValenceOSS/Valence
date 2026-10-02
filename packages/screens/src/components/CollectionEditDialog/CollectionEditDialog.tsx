import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { createCollection, updateCollection } from '@ValenceClient/collections/fetchCollections';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import type { CollectionEditDialogProps } from './CollectionEditDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Makes a collection, or changes one: its name, what it gathers, and whether the order it is in
 * means something — a saga watched in release order, rather than a director's films in any order.
 *
 * @param isOpen - Whether it is showing.
 * @param onClose - Closes it.
 * @param collection - The collection being changed, or nothing to make a new one.
 * @param startsWith - What a new one holds from the start, such as the title it was made from.
 * @param onSaved - Called with the collection once it has been made or changed.
 */
const CollectionEditDialog = ({
  isOpen,
  onClose,
  collection,
  startsWith = [],
  onSaved,
}: CollectionEditDialogProps) => {
  const cache = useQueryClient();
  const [name, setName] = useState(collection?.name ?? '');
  const [description, setDescription] = useState(collection?.description ?? '');
  const [isOrdered, setIsOrdered] = useState(collection?.isOrdered ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const isNew = collection === undefined;
  const title = isNew
    ? say('common.newCollection')
    : say('screens.collectionEditDialog.editCollection');

  useEffect(() => {
    if (isOpen) {
      setName(collection?.name ?? '');
      setDescription(collection?.description ?? '');
      setIsOrdered(collection?.isOrdered ?? false);
      setProblem(null);
    }
  }, [isOpen, collection]);

  const save = async () => {
    const trimmed = name.trim();
    const described = description.trim() === '' ? null : description.trim();

    if (trimmed === '') {
      setProblem(say('screens.collectionEditDialog.aCollectionNeedsAName'));

      return;
    }

    setIsSaving(true);

    const saved = isNew
      ? ((
          await createCollection({
            name: trimmed,
            description: described,
            isOrdered,
            ...(startsWith.length === 0 ? {} : { entries: [...startsWith] }),
          })
        )?.id ?? null)
      : (await updateCollection(collection.id, {
            name: trimmed,
            description: described,
            isOrdered,
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
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: isNew ? say('common.makeIt') : say('common.save'),
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

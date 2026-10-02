import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { addToCollection } from '@ValenceClient/collections/fetchCollections';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { CollectionEditDialog } from '@ValenceScreens/components/CollectionEditDialog/CollectionEditDialog';
import type { AddToCollectionDialogProps } from './AddToCollectionDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Puts a film or a programme into a collection: one already on the server, including those that
 * hold nothing yet, or a new one made around it. A collection it is already in is shown but cannot
 * be chosen again.
 *
 * @param subject - The film or programme, or null while nothing is being added.
 * @param title - What it is called, to say where it went.
 * @param onClose - Closes it.
 */
const AddToCollectionDialog = ({ subject, title, onClose }: AddToCollectionDialogProps) => {
  const cache = useQueryClient();
  const [chosen, setChosen] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isMaking, setIsMaking] = useState(false);
  const isOpen = subject !== null;
  const every = useQuery({ ...collectionQueries.all(true), enabled: isOpen });
  const holding = useQuery({
    ...collectionQueries.containing(subject ?? { mediaItemId: '' }),
    enabled: isOpen,
  });
  const already = new Set((holding.data ?? []).map((one) => one.id));
  const collections = every.data ?? [];

  useEffect(() => {
    if (isOpen) {
      setChosen(null);
      setIsMaking(false);
    }
  }, [isOpen]);

  const add = async () => {
    const into = collections.find((one) => one.id === chosen);

    if (subject === null || into === undefined) {
      return;
    }

    setIsAdding(true);

    const isAdded = await addToCollection(into.id, [subject]);

    setIsAdding(false);
    void cache.invalidateQueries({ queryKey: collectionQueries.key });

    if (!isAdded) {
      notify.failed(say('screens.addToCollectionDialog.thatCouldNotBeAdded'));

      return;
    }

    notify.worked(
      say('screens.addToCollectionDialog.titleIsNowInName', { title, name: into.name }),
    );
    onClose();
  };

  return (
    <>
      <Dialog
        label={say('screens.addToCollectionDialog.addTitleToACollection', { title })}
        isOpen={isOpen && !isMaking}
        onClose={onClose}
      >
        <DialogTitle
          title={say('screens.addToCollectionDialog.addTitleToACollection', { title })}
        />

        <DialogContent className="flex flex-col gap-4">
          {every.isPending ? (
            <Spinner size="sm" label={say('screens.addToCollectionDialog.readingTheCollections')} />
          ) : collections.length === 0 ? (
            <p className="text-sm text-text-muted">
              {say('screens.addToCollectionDialog.thereAreNoCollectionsYet')}
            </p>
          ) : (
            <ChoiceList
              label={say('common.collections')}
              value={chosen}
              onChoose={setChosen}
              choices={collections.map((collection) => ({
                id: collection.id,
                title: collection.name,
                detail: sayCount('common.count.titles', collection.entryCount),
                ...(already.has(collection.id)
                  ? { isDisabled: true, note: say('screens.addToCollectionDialog.alreadyInIt') }
                  : {}),
              }))}
            />
          )}
        </DialogContent>

        <DialogFooter
          lead={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsMaking(true);
              }}
            >
              <Icon of={PlusIcon} size={16} />
              {say('common.newCollection')}
            </Button>
          }
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: say('common.add'),
            onChoose: () => {
              void add();
            },
            isLoading: isAdding,
            isDisabled: chosen === null,
          }}
        />
      </Dialog>

      <CollectionEditDialog
        isOpen={isOpen && isMaking}
        startsWith={subject === null ? [] : [subject]}
        onClose={() => {
          setIsMaking(false);
        }}
        onSaved={() => {
          notify.worked(say('screens.addToCollectionDialog.titleIsInANewCollection', { title }));
          onClose();
        }}
      />
    </>
  );
};

AddToCollectionDialog.displayName = 'AddToCollectionDialog';

export { AddToCollectionDialog };

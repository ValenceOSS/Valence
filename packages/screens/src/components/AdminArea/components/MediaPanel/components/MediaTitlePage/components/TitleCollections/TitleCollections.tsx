import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X as XIcon, FolderPlus as FolderPlusFilledIcon } from '@keyline-icons/react/fill';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { dropFromCollection } from '@ValenceClient/collections/fetchCollections';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { notify } from '@ValenceUI/notify';
import { AddToCollectionDialog } from '@ValenceScreens/components/AddToCollectionDialog/AddToCollectionDialog';
import type { TitleCollectionsProps } from './TitleCollections.types';
import { say } from '@ValenceI18n/say';

/**
 * The collections a film or programme is in, on its page: each named, with a way to take the title
 * out of it, and a way to add it to another.
 *
 * @param subject - The film or programme.
 * @param name - What it is called, to say where it went.
 */
const TitleCollections = ({ subject, name }: TitleCollectionsProps) => {
  const cache = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [dropping, setDropping] = useState<string | null>(null);
  const holding = useQuery(collectionQueries.containing(subject));
  const collections = (holding.data ?? []).filter((one) => !one.isSmart);

  /**
   * Takes the title out of one collection.
   *
   * @param collectionId - The collection.
   * @param collectionName - What it is called.
   */
  const drop = async (collectionId: string, collectionName: string) => {
    setDropping(collectionId);

    const detail = await cache.fetchQuery(collectionQueries.one(collectionId));
    const entry = detail.entries.find((one) =>
      'mediaItemId' in subject
        ? one.media.id === subject.mediaItemId
        : one.media.seriesId === subject.seriesId,
    );
    const isGone = entry !== undefined && (await dropFromCollection(collectionId, entry.id));

    setDropping(null);
    void cache.invalidateQueries({ queryKey: collectionQueries.key });

    if (isGone) {
      notify.worked(
        say('screens.adminArea.titleCollections.titleIsNoLongerInName', {
          title: name,
          name: collectionName,
        }),
      );
    } else {
      notify.failed(say('screens.adminArea.titleCollections.thatCouldNotBeTakenOut'));
    }
  };

  return (
    <PanelCard
      title={say('common.collections')}
      actions={
        <Button
          variant="secondary"
          size="xs"
          onClick={() => {
            setIsAdding(true);
          }}
        >
          <Icon of={FolderPlusFilledIcon} size={14} />
          {say('screens.adminArea.mediaPanel.addToACollection')}
        </Button>
      }
    >
      {collections.length === 0 ? (
        <p className="text-[0.8125rem] text-text-muted">
          {say('screens.adminArea.titleCollections.inNoCollectionYet')}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {collections.map((collection) => (
            <li
              key={collection.id}
              className="flex h-7 items-center gap-1 rounded-full bg-[var(--surface-hover)] py-0.5 ps-3 pe-1 text-[0.8125rem] text-text"
            >
              {collection.name}
              <Button
                variant="ghost"
                size="xs"
                isIconOnly
                label={say('screens.adminArea.titleCollections.takeItOutOfName', {
                  name: collection.name,
                })}
                disabled={dropping === collection.id}
                onClick={() => {
                  void drop(collection.id, collection.name);
                }}
              >
                <Icon of={XIcon} size={13} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddToCollectionDialog
        subject={isAdding ? subject : null}
        title={name}
        onClose={() => {
          setIsAdding(false);
        }}
      />
    </PanelCard>
  );
};

TitleCollections.displayName = 'TitleCollections';

export { TitleCollections };

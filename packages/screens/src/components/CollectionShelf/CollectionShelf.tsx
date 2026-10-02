import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { CollectionTile } from '@ValenceScreens/components/CollectionTile/CollectionTile';
import { CollectionEditDialog } from '@ValenceScreens/components/CollectionEditDialog/CollectionEditDialog';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import type { CollectionShelfProps } from './CollectionShelf.types';
import { say } from '@ValenceI18n/say';

/**
 * A row of the collections on this server — the sagas, box sets and bodies of work that belong
 * together — each holding something this viewer may watch. Somebody who looks after the libraries
 * sees the empty ones too, and can start a new one from here.
 *
 * It says nothing at all where there are no collections, since an empty row is noise on a page that
 * is otherwise about what to watch.
 *
 * @param onOpen - Told which collection was chosen.
 */
const CollectionShelf = ({ onOpen }: CollectionShelfProps) => {
  const { may } = useWhatIMayDo();
  const mayManage = may('library.edit');
  const asked = useQuery(collectionQueries.all(mayManage));
  const [isMaking, setIsMaking] = useState(false);
  const collections = asked.data ?? [];

  if (collections.length === 0) {
    return null;
  }

  return (
    <>
      <Rail
        title={say('common.collections')}
        count={collections.length}
        sizesCards
        cards="portrait"
        className="-mx-4 sm:-mx-6"
        {...(mayManage
          ? {
              action: (
                <PanelCardAction
                  icon={PlusIcon}
                  onClick={() => {
                    setIsMaking(true);
                  }}
                >
                  {say('common.newCollection')}
                </PanelCardAction>
              ),
            }
          : {})}
      >
        {collections.map((collection, at) => (
          <RevealItem key={collection.id} index={at} className="shrink-0 snap-start">
            <CollectionTile
              collection={collection}
              onOpen={() => {
                onOpen(collection.id);
              }}
            />
          </RevealItem>
        ))}
      </Rail>

      {mayManage ? (
        <CollectionEditDialog
          isOpen={isMaking}
          onClose={() => {
            setIsMaking(false);
          }}
          onSaved={onOpen}
        />
      ) : null}
    </>
  );
};

CollectionShelf.displayName = 'CollectionShelf';

export { CollectionShelf };

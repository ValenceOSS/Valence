import { useQuery } from '@tanstack/react-query';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { collectionsHolding } from '@ValenceClient/collections/collectionsHolding';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { CollectionTile } from '@ValenceScreens/components/CollectionTile/CollectionTile';
import type { CollectionShelfProps } from './CollectionShelf.types';
import { say } from '@ValenceI18n/say';

/**
 * A row of the collections of films, or of programmes — the sagas, box sets and bodies of work that
 * belong together, and this viewer's own smart ones — each holding something this viewer may
 * watch. Somebody who looks after the libraries sees the empty ones too.
 *
 * It says nothing at all where there are none, since an empty row is noise on a page that is
 * otherwise about what to watch; new ones are started from the page's own heading.
 *
 * @param holds - Whether the row is of collections of films or of programmes.
 * @param onOpen - Told which collection was chosen.
 * @param className - Where the row sits.
 */
const CollectionShelf = ({ holds, onOpen, className }: CollectionShelfProps) => {
  const { may } = useWhatIMayDo();
  const asked = useQuery(collectionQueries.all(may('library.edit')));
  const collections = collectionsHolding(asked.data ?? [], holds);

  if (collections.length === 0) {
    return null;
  }

  return (
    <Rail
      title={say('common.collections')}
      count={collections.length}
      sizesCards
      cards="portrait"
      {...(className === undefined ? {} : { className })}
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
  );
};

CollectionShelf.displayName = 'CollectionShelf';

export { CollectionShelf };

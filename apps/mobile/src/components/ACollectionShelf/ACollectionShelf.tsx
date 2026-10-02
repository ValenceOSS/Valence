import { collectionCoverPath } from '@ValenceClient/collections/collectionCoverPath';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Button } from '@ValenceMobile/components/Button/Button';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { ACollectionShelfProps } from './ACollectionShelf.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * A shelf of the collections on the server — the sagas, box sets and bodies of work that belong
 * together — each standing like a poster and opening its own page.
 *
 * @param collections - The collections.
 * @param onLookAtCollection - Told which collection to open.
 */
const ACollectionShelf = ({ collections, onLookAtCollection }: ACollectionShelfProps) => (
  <AShelf title={say('common.collections')}>
    {collections.map((collection) => {
      const cover = collectionCoverPath(collection);

      return (
        <Button
          key={collection.id}
          tone="bare"
          label={collection.name}
          onPress={() => {
            onLookAtCollection(collection.id);
          }}
        >
          <APoster
            title={collection.name}
            artwork={cover === null ? null : onThisServer(cover)}
            note={sayCount('common.count.titles', collection.entryCount)}
          />
        </Button>
      );
    })}
  </AShelf>
);

ACollectionShelf.displayName = 'ACollectionShelf';

export { ACollectionShelf };

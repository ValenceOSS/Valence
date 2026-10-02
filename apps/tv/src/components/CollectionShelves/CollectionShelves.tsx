import { memo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { arrangeCollection } from '@ValenceClient/collections/arrangeCollection';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { Shelf } from '@ValenceTv/components/Shelf/Shelf';
import type { CollectionShelvesProps } from './CollectionShelves.types';

/**
 * A shelf for each collection on the server that holds something this viewer may watch, named after
 * it and holding its films and programmes — in its own order where that order matters, and oldest
 * first where it does not. Collections are looked after from a browser; here they are only watched.
 *
 * @param progress - How far through each title this viewer is.
 * @param onOpen - Told to open a film's or a programme's page.
 */
const CollectionShelvesDrawn = ({ progress, onOpen }: CollectionShelvesProps) => {
  const listed = useQuery(collectionQueries.all());
  const read = useQueries({
    queries: (listed.data ?? []).map((collection) => collectionQueries.one(collection.id)),
  });

  return (
    <>
      {read.map(({ data }) =>
        data === undefined || data.entries.length === 0 ? null : (
          <Shelf
            key={data.collection.id}
            title={data.collection.name}
            items={arrangeCollection(
              data.entries,
              data.collection.isOrdered ? 'position' : 'year',
            ).map((entry) => entry.media)}
            progress={progress}
            onOpen={onOpen}
          />
        ),
      )}
    </>
  );
};

const CollectionShelves = memo(CollectionShelvesDrawn);

CollectionShelves.displayName = 'CollectionShelves';

export { CollectionShelves };

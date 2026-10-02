import { Layers as LayersIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { collectionArtworkUrl } from '@ValenceClient/collections/fetchCollections';
import type { CollectionCoverProps } from './CollectionCover.types';

/**
 * A collection's cover, standing upright like the posters beside it: the artwork somebody gave it,
 * or else the posters of what is in it — the first one alone until there are four, then four in a
 * grid — and a quiet mark while it holds nothing with a poster.
 *
 * @param collection - The collection.
 * @param iconSize - How large the mark is where there is nothing to show.
 * @param className - Its size and anything else the caller's layout needs.
 */
const CollectionCover = ({ collection, iconSize = 28, className }: CollectionCoverProps) => {
  const own = collectionArtworkUrl(collection);
  const posters = collection.coverMediaIds;
  const tiles =
    own !== null
      ? [own]
      : (posters.length >= 4 ? posters.slice(0, 4) : posters.slice(0, 1)).map((mediaId) =>
          artworkUrl(mediaId, 'poster'),
        );

  return (
    <span
      role="img"
      aria-label={collection.name}
      className={cn(
        'grid aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-surface-raised text-text-muted ring-1 ring-line',
        tiles.length === 4 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1',
        className,
      )}
    >
      {tiles.length === 0 ? (
        <span className="flex items-center justify-center">
          <Icon of={LayersIcon} size={iconSize} />
        </span>
      ) : (
        tiles.map((address) => (
          <img
            key={address}
            src={address}
            alt=""
            loading="lazy"
            draggable={false}
            className="size-full object-cover"
          />
        ))
      )}
    </span>
  );
};

CollectionCover.displayName = 'CollectionCover';

export { CollectionCover };

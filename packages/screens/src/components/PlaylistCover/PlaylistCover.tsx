import { ListMusic as ListMusicIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import type { PlaylistCoverProps } from './PlaylistCover.types';

/**
 * A playlist's cover, made of the covers of what is in it: the first album's alone where there is
 * only one, four in a grid once there are four, and a quiet mark where there is nothing yet.
 *
 * @param name - The playlist, for anybody not looking at it.
 * @param albumIds - The albums whose covers to use, in the order they come up.
 * @param className - Its size and anything else the caller's layout needs.
 */
const PlaylistCover = ({ name, albumIds, className }: PlaylistCoverProps) => {
  const tiles = albumIds.length >= 4 ? albumIds.slice(0, 4) : albumIds.slice(0, 1);

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'grid aspect-square shrink-0 overflow-hidden rounded-md bg-hover text-text-muted',
        tiles.length === 4 ? 'grid-cols-2' : 'grid-cols-1',
        className,
      )}
    >
      {tiles.length === 0 ? (
        <span className="flex items-center justify-center">
          <Icon of={ListMusicIcon} size={22} />
        </span>
      ) : (
        tiles.map((albumId) => (
          <img
            key={albumId}
            src={albumArtworkUrl(albumId)}
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

PlaylistCover.displayName = 'PlaylistCover';

export { PlaylistCover };

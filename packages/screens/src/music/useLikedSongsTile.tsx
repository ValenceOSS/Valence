import { LikedCover } from '@ValenceScreens/components/LikedCover/LikedCover';
import { useMusicNavigation } from './useMusicNavigation';
import type { MusicTileProps } from '@ValenceScreens/components/MusicTile/MusicTile.types';

/**
 * The tile that opens somebody's liked songs, which sits at the front of their playlists wherever
 * those are shown.
 *
 * @returns What to draw the tile with.
 */
const useLikedSongsTile = (): MusicTileProps => {
  const { open } = useMusicNavigation();

  return {
    title: 'Liked Songs',
    detail: 'Every song you have liked',
    artwork: <LikedCover />,
    onOpen: () => {
      open({ kind: 'liked' });
    },
  };
};

export { useLikedSongsTile };

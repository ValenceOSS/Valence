import { LikedCover } from '@ValenceScreens/components/LikedCover/LikedCover';
import { musicMenuFor } from './musicMenuFor';
import { useMusicNavigation } from './useMusicNavigation';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { MusicTileProps } from '@ValenceScreens/components/MusicTile/MusicTile.types';

/**
 * The tile that opens somebody's liked songs, which sits at the front of their playlists wherever
 * those are shown.
 *
 * @returns What to draw the tile with.
 */
const useLikedSongsTile = (): MusicTileProps => {
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();

  return {
    title: 'Liked Songs',
    detail: 'Every song you have liked',
    artwork: <LikedCover />,
    onOpen: () => {
      open({ kind: 'liked' });
    },
    menu: musicMenuFor({ kind: 'liked' }, 'Liked Songs', player, open),
  };
};

export { useLikedSongsTile };

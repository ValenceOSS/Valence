import { useQuery } from '@tanstack/react-query';
import { Heart as HeartFilledIcon } from '@keyline-icons/react/fill';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { coverAlbumsOf } from '@ValenceClient/music/coverAlbumsOf';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useMyPlaylists } from '@ValenceClient/music/useMyPlaylists';
import { musicMenuFor } from './musicMenuFor';
import { useMusicNavigation } from './useMusicNavigation';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { MusicTileProps } from '@ValenceScreens/components/MusicTile/MusicTile.types';
import { say } from '@ValenceI18n/say';

/**
 * The tile that opens somebody's liked songs, which sits at the front of their playlists wherever
 * those are shown.
 *
 * @returns What to draw the tile with.
 */
const useLikedSongsTile = (): MusicTileProps => {
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();
  const liked = useQuery(musicQueries.liked());
  const addingTo = useMyPlaylists();

  return {
    title: say('common.likedSongs2'),
    detail: say('common.everySongYouHaveLiked'),
    artwork: (
      <PlaylistCover
        name="Liked Songs"
        albumIds={coverAlbumsOf(liked.data ?? [])}
        standIn={HeartFilledIcon}
        iconSize={40}
        className="w-full"
      />
    ),
    onOpen: () => {
      open({ kind: 'liked' });
    },
    menu: musicMenuFor({ kind: 'liked' }, say('common.likedSongs2'), player, open, addingTo),
  };
};

export { useLikedSongsTile };

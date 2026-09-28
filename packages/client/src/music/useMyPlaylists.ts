import { useQuery, useQueryClient } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import type { MyPlaylists } from '@ValenceClient/music/useMyPlaylists.types';

/**
 * The playlists this profile may add to, and a way to say one has changed so every list of them
 * reads them again.
 *
 * @returns Their own playlists, and what to call once one changes.
 */
const useMyPlaylists = (): MyPlaylists => {
  const cache = useQueryClient();
  const playlists = useQuery(musicQueries.playlists());

  return {
    mine: (playlists.data ?? []).filter((playlist) => playlist.isMine),
    changed: () => {
      void cache.invalidateQueries({ queryKey: musicQueries.playlistsKey });
    },
  };
};

export { useMyPlaylists };

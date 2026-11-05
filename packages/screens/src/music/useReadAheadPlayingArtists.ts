import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';

/**
 * Reads the pages of whoever is playing before anybody asks for them, since the name in the player
 * bar is the artist link pressed most, so that page opens already drawn.
 */
const useReadAheadPlayingArtists = (): void => {
  const cache = useQueryClient();
  const { state } = useMusicPlayer();
  const artistIds = state.current?.artists.map((artist) => artist.id).join(' ') ?? '';

  useEffect(() => {
    for (const artistId of artistIds.split(' ').filter((id) => id !== '')) {
      void cache.prefetchQuery(musicQueries.artist(artistId));
    }
  }, [cache, artistIds]);
};

export { useReadAheadPlayingArtists };

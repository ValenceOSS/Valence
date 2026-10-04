import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { createVideoPlayer } from 'expo-video';
import { fetchSample } from '@ValenceClient/requests/fetchSample';
import type { VideoPlayer } from 'expo-video';
import { say } from '@ValenceI18n/say';

/**
 * Plays half a minute of an album before somebody asks for it, as the web does: one sample at a
 * time, the same one again stopping it, and a note where there is no sample to play. The sample is
 * played through the phone's media player, which plays audio as readily as video.
 *
 * @returns Which album is playing, by its key, and a way to start or stop one.
 */
const useAlbumSample = () => {
  const cache = useQueryClient();
  const playing = useRef<VideoPlayer | null>(null);
  const [heard, setHeard] = useState<string | null>(null);

  const stop = useCallback(() => {
    playing.current?.pause();
    playing.current?.release();
    playing.current = null;
    setHeard(null);
  }, []);

  useEffect(() => stop, [stop]);

  const toggle = useCallback(
    async (key: string, artist: string, album: string) => {
      if (heard === key) {
        stop();

        return;
      }

      stop();

      const url = await cache
        .fetchQuery({
          queryKey: ['requests', 'sample', artist, album],
          queryFn: () => fetchSample(artist, album),
          staleTime: Infinity,
        })
        .catch(() => null);

      if (url === null) {
        Alert.alert(say('screens.requests.useSample.thereIsNoSampleOfAlbum', { album }));

        return;
      }

      const player = createVideoPlayer(url);

      player.addListener('playToEnd', stop);
      player.play();
      playing.current = player;
      setHeard(key);
    },
    [cache, heard, stop],
  );

  return { heard, toggle };
};

export { useAlbumSample };

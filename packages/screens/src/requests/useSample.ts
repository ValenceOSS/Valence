import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchSample } from '@ValenceClient/requests/fetchSample';
import { notify } from '@ValenceUI/notify';

/**
 * Plays half a minute of an album before somebody asks for it: one at a time, stopped by pressing it
 * again or by starting another, and stopped when the page goes. An album with no sample offered
 * says so rather than doing nothing.
 *
 * @returns Which album is playing or being found, and how to start or stop one.
 */
const useSample = () => {
  const cache = useQueryClient();
  const playing = useRef<HTMLAudioElement | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [finding, setFinding] = useState<string | null>(null);

  const stop = useCallback(() => {
    playing.current?.pause();
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
      setFinding(key);

      const url = await cache
        .fetchQuery({
          queryKey: ['requests', 'sample', artist, album],
          queryFn: () => fetchSample(artist, album),
          staleTime: Infinity,
        })
        .catch(() => null);

      setFinding(null);

      if (url === null) {
        notify.say(`There is no sample of ${album} to hear.`);

        return;
      }

      const audio = new Audio(url);

      audio.addEventListener('ended', stop);
      playing.current = audio;
      setHeard(key);
      await audio.play().catch(stop);
    },
    [cache, heard, stop],
  );

  return { heard, finding, toggle };
};

export { useSample };

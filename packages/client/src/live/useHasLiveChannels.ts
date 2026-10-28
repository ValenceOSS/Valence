import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MINUTE_MS } from '@ValenceCore/tokens/MINUTE_MS';
import { liveWindowAt } from '@ValenceClient/live/liveWindowAt';
import { liveQueries } from '@ValenceClient/query/liveQueries';

/**
 * Whether the server has any live channels, read from the four hours of guide the web and phone
 * guides ask for so they share an answer. Whatever asks is drawn again only when the answer changes,
 * not every minute or every time the guide does.
 *
 * @returns Whether there is a live channel to show.
 */
const useHasLiveChannels = (): boolean => {
  const [from, setFrom] = useState(() => liveWindowAt(Date.now()).from);

  useEffect(() => {
    let shown = liveWindowAt(Date.now()).from;
    const timer = setInterval(() => {
      const next = liveWindowAt(Date.now()).from;

      if (next !== shown) {
        shown = next;
        setFrom(next);
      }
    }, MINUTE_MS);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const { until } = liveWindowAt(from);
  const live = useQuery({
    ...liveQueries.guide(new Date(from).toISOString(), new Date(until).toISOString()),
    select: (guide) => guide.channels.length > 0,
  });

  return live.data ?? false;
};

export { useHasLiveChannels };

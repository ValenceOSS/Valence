import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { keepLiveChannel } from '@ValenceClient/live/keepLiveChannel';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import type { QueryKey } from '@tanstack/react-query';
import type { LiveChannel, LiveGuide } from '@ValenceContracts/schemas/LiveTv';

/**
 * Keeps a channel as a favourite or lets it go, marking it in the guide at once rather than when
 * the server answers, and putting everything back if the server refuses.
 *
 * @param guideKey - The key the guide being shown is held under.
 * @param onFailed - Told the server refused, so whoever shows the guide can say so.
 * @returns How to keep a channel, or let it go.
 */
const useKeepLiveChannel = (
  guideKey: QueryKey,
  onFailed: () => void,
): ((channel: LiveChannel) => void) => {
  const cache = useQueryClient();

  return useCallback(
    (channel: LiveChannel) => {
      const isKept = !channel.isFavourite;

      cache.setQueryData(guideKey, (was: LiveGuide | undefined) =>
        was === undefined
          ? was
          : {
              ...was,
              channels: was.channels.map((one) =>
                one.id === channel.id ? { ...one, isFavourite: isKept } : one,
              ),
            },
      );

      void keepLiveChannel(channel.id, isKept).then((isDone) => {
        if (!isDone) {
          onFailed();
          void cache.invalidateQueries({ queryKey: liveQueries.key });
        }
      });
    },
    [cache, guideKey, onFailed],
  );
};

export { useKeepLiveChannel };

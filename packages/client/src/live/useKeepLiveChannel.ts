import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { keepLiveChannel } from '@ValenceClient/live/keepLiveChannel';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import type { LiveChannel, LiveGuide } from '@ValenceContracts/schemas/LiveTv';

/**
 * Keeps a channel as a favourite or lets it go, marking it at once in every stretch of the guide
 * held rather than when the server answers, then reading the guide again once it has — so a read
 * already on its way with the old answer cannot undo the mark, and a refusal puts it back.
 *
 * @param onFailed - Told the server refused, so whoever shows the guide can say so.
 * @returns How to keep a channel, or let it go.
 */
const useKeepLiveChannel = (onFailed: () => void): ((channel: LiveChannel) => void) => {
  const cache = useQueryClient();

  return useCallback(
    (channel: LiveChannel) => {
      const isKept = !channel.isFavourite;

      void cache
        .cancelQueries({ queryKey: liveQueries.guides })
        .then(() => {
          cache.setQueriesData({ queryKey: liveQueries.guides }, (was: LiveGuide | undefined) =>
            was === undefined
              ? was
              : {
                  ...was,
                  channels: was.channels.map((one) =>
                    one.id === channel.id ? { ...one, isFavourite: isKept } : one,
                  ),
                },
          );

          return keepLiveChannel(channel.id, isKept);
        })
        .then((isDone) => {
          if (!isDone) {
            onFailed();
          }

          void cache.invalidateQueries({ queryKey: liveQueries.guides });
        });
    },
    [cache, onFailed],
  );
};

export { useKeepLiveChannel };

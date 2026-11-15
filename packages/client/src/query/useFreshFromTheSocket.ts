import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { announcementQueries } from '@ValenceClient/query/announcementQueries';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';
import { PresenceEventSchema } from '@ValenceClient/presence/PresenceEventSchema';
import { gatherMediaNews } from '@ValenceClient/query/gatherMediaNews';
import { freshenAfterMedia } from '@ValenceClient/query/freshenAfterMedia';
import type { MediaNews } from '@ValenceClient/query/gatherMediaNews';

type SaysWhatChanged = Pick<RealtimeClient, 'subscribe' | 'onResumed'>;

const MEDIA_SETTLES_AFTER_MS = 3_000;

const MEDIA_WAITS_AT_MOST_MS = 12_000;

/**
 * Throws away what the server has just said is out of date, gathering a run of media events into
 * one refresh once they settle and refreshing only what they name.
 *
 * Each topic throws away only what it says something about. A reconnection asks again for whatever
 * is on screen and already stale, since it missed whatever happened while it was gone; what is
 * fresh, or already being asked for, is left alone.
 *
 * @param client - Whatever says what changed, which is the shared socket, or `null` where there is
 *   nobody signed in yet to hear about a change, which listens for nothing.
 */
const useFreshFromTheSocket = (client: SaysWhatChanged | null = getRealtimeClient()): void => {
  const cache = useQueryClient();

  useEffect(() => {
    if (client === null) {
      return;
    }

    let gathered: MediaNews | null = null;
    let firstAt: number | null = null;
    let settling: ReturnType<typeof setTimeout> | undefined;

    const settle = () => {
      const news = gathered;

      gathered = null;
      firstAt = null;
      settling = undefined;

      if (news !== null) {
        freshenAfterMedia(cache, news);
      }
    };

    const stopWatching = [
      client.subscribe('media', (event) => {
        const now = Date.now();

        gathered = gatherMediaNews(gathered, event);
        firstAt ??= now;
        clearTimeout(settling);
        settling = setTimeout(
          settle,
          Math.max(0, Math.min(MEDIA_SETTLES_AFTER_MS, firstAt + MEDIA_WAITS_AT_MOST_MS - now)),
        );
      }),

      client.subscribe('notifications', () => {
        void cache.invalidateQueries({ queryKey: notificationQueries.key });
      }),

      client.subscribe('presence', (event) => {
        if (PresenceEventSchema.safeParse(event.payload).data?.kind === 'stopped') {
          void cache.invalidateQueries({ queryKey: sessionQueries.who().queryKey });
        }
      }),

      client.subscribe('profile', () => {
        void cache.invalidateQueries({ queryKey: sessionQueries.key });
        void cache.invalidateQueries({ queryKey: profileQueries.key });
      }),

      client.subscribe('requests', () => {
        void cache.invalidateQueries({ queryKey: requestsQueries.key });
      }),

      client.subscribe('keeping', () => {
        void cache.invalidateQueries({ queryKey: downloadQueries.key });
      }),

      client.subscribe('plugins', () => {
        void cache.invalidateQueries({ queryKey: pluginQueries.key });
      }),

      client.subscribe('audit', () => {
        void cache.invalidateQueries({ queryKey: [...adminQueries.key, 'audit'] });
      }),

      client.subscribe('linking', () => {
        void cache.invalidateQueries({ queryKey: [...adminQueries.key, 'linking'] });
      }),

      client.subscribe('announcement', () => {
        void cache.invalidateQueries({ queryKey: announcementQueries.key });
      }),

      client.subscribe('sessions', () => {
        for (const watching of [
          adminQueries.sessions,
          adminQueries.overview,
          adminQueries.monitor,
        ]) {
          void cache.invalidateQueries({ queryKey: watching().queryKey });
        }
      }),

      client.onResumed(() => {
        void cache.invalidateQueries(undefined, { cancelRefetch: false });
      }),
    ];

    return () => {
      clearTimeout(settling);

      for (const stop of stopWatching) {
        stop();
      }
    };
  }, [cache, client]);
};

export { MEDIA_SETTLES_AFTER_MS, MEDIA_WAITS_AT_MOST_MS, useFreshFromTheSocket };

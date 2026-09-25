import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';

type SaysWhatChanged = Pick<RealtimeClient, 'subscribe' | 'onResumed'>;

/**
 * Throws away what the server has just said is out of date.
 *
 * A cache is only as good as the moment it stops trusting itself, and the usual answer — a timer
 * that guesses — is the wrong one here: this application already holds a socket that says when the
 * library was scanned, when a notification arrived, when somebody's permissions changed, when a
 * request moved along. Being told beats guessing, so the socket does the invalidating and the
 * polling intervals go.
 *
 * A reconnection invalidates everything, because a tab that was asleep missed whatever happened
 * while it was gone and has no way to find out what. What is already being asked for again is left
 * to finish rather than asked for a second time.
 *
 * Nothing here is worth knowing before somebody is signed in — a socket opened to watch for changes
 * nobody may see yet is a connection with nothing to say, held open against a server that has
 * already refused everything else this tab asked it before it had a session. Passed `null`, this
 * listens for nothing and leaves the shared socket unopened, rather than starting it the moment
 * anything on the page happens to mount.
 *
 * @param client - Whatever says what changed, which is the shared socket, or `null` where there is
 *   nobody signed in yet to hear about a change.
 */
const useFreshFromTheSocket = (client: SaysWhatChanged | null = getRealtimeClient()): void => {
  const cache = useQueryClient();

  useEffect(() => {
    if (client === null) {
      return;
    }

    const stopWatching = [
      client.subscribe('media', () => {
        void cache.invalidateQueries({ queryKey: libraryQueries.key });
        void cache.invalidateQueries({ queryKey: musicQueries.key });
        void cache.invalidateQueries({ queryKey: musicQueries.playlistsKey });
      }),

      client.subscribe('notifications', () => {
        void cache.invalidateQueries({ queryKey: notificationQueries.key });
      }),

      client.subscribe('profile', () => {
        void cache.invalidateQueries({ queryKey: sessionQueries.key });
      }),

      client.subscribe('requests', () => {
        void cache.invalidateQueries({ queryKey: requestsQueries.key });
      }),

      client.subscribe('keeping', () => {
        void cache.invalidateQueries({ queryKey: downloadQueries.key });
      }),

      client.subscribe('sessions', () => {
        void cache.invalidateQueries({ queryKey: adminQueries.key });
      }),

      client.onResumed(() => {
        void cache.invalidateQueries(undefined, { cancelRefetch: false });
      }),
    ];

    return () => {
      for (const stop of stopWatching) {
        stop();
      }
    };
  }, [cache, client]);
};

export { useFreshFromTheSocket };

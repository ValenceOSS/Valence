import { createRealtimeClient } from './createRealtimeClient';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { realtimeBackoffMs } from './realtimeBackoffMs';
import type { RealtimeClient } from './createRealtimeClient';

let client: RealtimeClient | null = null;

let isAllowedToStart = true;

/**
 * Says whether the shared connection may actually run, for whoever knows when that is true and
 * false rather than making everything that might ask for the client know it too.
 *
 * A dozen things want the socket the moment somebody is signed in — the music remote, the watch
 * party, the library's own freshness — and each of them is right to ask for it the way they always
 * have. What none of them should have to know is that nobody is signed in yet, since asking then is
 * asking a server to refuse a connection it was never going to accept. One place says so instead,
 * and everything sharing the one client is quiet until it does.
 *
 * @param allowed - Whether the client may run right now.
 */
const allowRealtimeClientToStart = (allowed: boolean): void => {
  if (allowed === isAllowedToStart) {
    return;
  }

  isAllowedToStart = allowed;

  if (allowed) {
    client?.start();
  } else {
    client?.stop();
  }
};

/**
 * The one connection this tab has, made when something first wants it — and only once it is allowed
 * to run.
 *
 * Shared rather than made per caller because the whole point of moving off separate streams was to
 * stop a page holding several connections at once — a browser allows only a handful to one origin,
 * and an administrator with a player open was using most of them.
 *
 * @returns The client, started where it is allowed to be.
 */
const getRealtimeClient = (): RealtimeClient => {
  client ??= createRealtimeClient({
    connect: platformInUse().openSocket,
    schedule: (run, afterMs) => {
      const timer = setTimeout(run, afterMs);

      return () => {
        clearTimeout(timer);
      };
    },
    backoffMs: realtimeBackoffMs,
  });

  if (isAllowedToStart) {
    client.start();
  }

  return client;
};

export { allowRealtimeClientToStart, getRealtimeClient };

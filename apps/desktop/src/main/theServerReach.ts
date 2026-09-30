import type { AskingTheServer } from '@ValenceDesktop/main/keepADownload';

type ServerReach = {
  isReachable: () => boolean;
  noteReached: () => void;
  noteMissed: () => void;
  checkNow: () => void;
  whenChanged: (listener: (isReachable: boolean) => void) => () => void;
  stop: () => void;
};

type WhatReachNeeds = {
  where: () => string;
  fetching: AskingTheServer;
  every: number;
  within?: number;
};

const ANSWERS_WITHIN = 5000;

/**
 * Whether Valence is answering, kept up to date by the process that does the asking.
 *
 * This client is the only one that can say honestly. Every request the window makes goes through
 * the main process on its way to the server, so a connection that could not be made is seen here
 * first and seen as what it is — rather than arriving in a screen as a failed query indistinguishable
 * from a server that answered badly. A browser has nothing better than whether the machine has a
 * network at all, which is a different question.
 *
 * A refusal is not a miss. A server that answers at all is reachable, whatever it says: an item
 * nobody may see and an item that does not exist are both replies, and treating either as a
 * disappearance would drop somebody into offline mode over a typo in an address.
 *
 * A server can also take a connection and then say nothing, as one does when the network between
 * drops what is sent rather than refusing it. No request ever fails, so nothing is ever missed. So
 * a request left waiting can ask for a check, which gives the server a few seconds to say it is
 * there before counting it gone; the request itself is left to go on waiting, since some answers
 * are slow by nature and slow is not gone. What a check finds is set aside where something newer
 * was heard while it was out, or the server it asked is no longer the one chosen.
 *
 * While it is out of reach this asks quietly on a timer, because nothing else will. Offline mode
 * stops the application making the requests that would otherwise notice the server coming back, so
 * without this a laptop that reconnected would sit on a shelf of downloads until somebody restarted
 * it. While it is reachable nothing is polled — the application's own traffic is a better and
 * cheaper signal than a heartbeat.
 *
 * @param needs - Where the server is, how to ask, and how often to try while it is not there.
 * @returns What is known about reach, the ways of telling it something, and a way to have it check.
 */
const theServerReach = (needs: WhatReachNeeds): ServerReach => {
  const listeners = new Set<(isReachable: boolean) => void>();

  let isReachable = true;
  let asking: ReturnType<typeof setTimeout> | null = null;
  let isChecking = false;
  let heardSince = 0;

  const within = needs.within ?? ANSWERS_WITHIN;

  const isAnswering = async (server: string): Promise<boolean> =>
    needs
      .fetching(new URL('/api/health', server).toString(), {
        method: 'GET',
        signal: AbortSignal.timeout(within),
      })
      .then(() => true)
      .catch(() => false);

  const stopAsking = (): void => {
    if (asking !== null) {
      clearTimeout(asking);
      asking = null;
    }
  };

  const settle = (nowReachable: boolean): void => {
    if (nowReachable === isReachable) {
      return;
    }

    isReachable = nowReachable;

    for (const listener of listeners) {
      listener(nowReachable);
    }

    if (nowReachable) {
      stopAsking();
    } else {
      keepAsking();
    }
  };

  /**
   * Asks whether the server is back, once, and arranges to ask again if it is not.
   */
  function keepAsking(): void {
    stopAsking();

    asking = setTimeout(() => {
      const server = needs.where();

      if (server === '') {
        keepAsking();

        return;
      }

      void isAnswering(server).then((isThere) => {
        if (isThere) {
          settle(true);
        } else {
          keepAsking();
        }
      });
    }, needs.every);

    asking.unref();
  }

  return {
    isReachable: () => isReachable,
    noteReached: () => {
      heardSince += 1;
      settle(true);
    },
    noteMissed: () => {
      heardSince += 1;
      settle(false);
    },
    checkNow: () => {
      const server = needs.where();

      if (!isReachable || isChecking || server === '') {
        return;
      }

      isChecking = true;

      const heardBefore = heardSince;

      void isAnswering(server).then((isThere) => {
        isChecking = false;

        if (heardSince === heardBefore && needs.where() === server) {
          settle(isThere);
        }
      });
    },
    whenChanged: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    stop: stopAsking,
  };
};

export type { ServerReach, WhatReachNeeds };

export { theServerReach };

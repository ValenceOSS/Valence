import type { Cancel, Schedule } from '@ValenceServer/realtime/createCoalescer';
import type { PresenceSession } from './PresenceService';

const MS_IN_SECOND = 1000;

type SessionLeaving = PresenceSession & {
  lastedSeconds: number;
};

type CreateSessionWatchOptions = {
  lingerMs: number;
  schedule: Schedule;
  now: () => number;
  onStarted: (session: PresenceSession) => void;
  onEnded: (session: SessionLeaving) => void;
};

type SessionWatch = {
  opened: (session: PresenceSession) => void;
  closed: (clientId: string) => void;
};

type Held = {
  session: PresenceSession;
  since: number;
  closedAt: number | null;
  leaving: Cancel | null;
};

/**
 * Turns connections going up and down into somebody arriving and somebody leaving.
 *
 * A socket is not a session. One closes every time a tab is reloaded, a laptop is shut, a phone
 * changes network, or a build is deployed, and announcing each of those as somebody leaving and
 * coming back would say nothing true about who is here. So a connection that goes is given a moment
 * to come back before anybody is told about it, and a connection that returns within that moment
 * cancels its own departure rather than counting as a second arrival.
 *
 * How long somebody stayed is measured to when their connection actually went, not to when this
 * decided to believe it, so the wait does not inflate every visit by its own length.
 *
 * @param lingerMs - How long a connection has to come back before it counts as gone.
 * @param schedule - How to wait, injected so this can be tested without a clock.
 * @param now - The clock, for how long somebody stayed.
 * @param onStarted - Called once, when somebody opens Valence.
 * @param onEnded - Called once, when somebody has gone and not come back.
 * @returns The watch.
 */
const createSessionWatch = ({
  lingerMs,
  schedule,
  now,
  onStarted,
  onEnded,
}: CreateSessionWatchOptions): SessionWatch => {
  const here = new Map<string, Held>();

  /**
   * Says that somebody has gone, and forgets them.
   *
   * @param clientId - Whose session ended.
   */
  const leave = (clientId: string) => {
    const held = here.get(clientId);

    if (held === undefined) {
      return;
    }

    here.delete(clientId);

    const went = held.closedAt ?? now();

    onEnded({
      ...held.session,
      lastedSeconds: Math.max(Math.round((went - held.since) / MS_IN_SECOND), 0),
    });
  };

  return {
    opened: (session) => {
      const held = here.get(session.clientId);

      if (held !== undefined) {
        held.leaving?.();

        if (held.session.accountId === session.accountId) {
          here.set(session.clientId, { session, since: held.since, closedAt: null, leaving: null });

          return;
        }

        leave(session.clientId);
      }

      here.set(session.clientId, { session, since: now(), closedAt: null, leaving: null });
      onStarted(session);
    },

    closed: (clientId) => {
      const held = here.get(clientId);

      if (held === undefined || held.leaving !== null) {
        return;
      }

      held.closedAt = now();
      held.leaving = schedule(() => {
        leave(clientId);
      }, lingerMs);
    },
  };
};

export type { SessionLeaving, SessionWatch };

export { createSessionWatch };

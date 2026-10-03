import { randomBytes } from 'node:crypto';

type Ticketed = { serverId: string; route: string; isWhole: boolean };

const TICKET_LASTS_MS = 6 * 60 * 60 * 1000;

const MOST_TICKETS = 5000;

/**
 * Tickets that let a player on a linked server's people's devices stream straight from this server
 * rather than through theirs: each is good for one session's manifest and segments, or one title's
 * file, for a few hours, and is the only thing a request needs to carry, since the player cannot
 * sign anything. Held in memory, since a session ends with a restart anyway.
 *
 * @param now - The clock.
 * @returns The tickets.
 */
const createDirectTickets = (now: () => number = Date.now) => {
  const held = new Map<string, Ticketed & { until: number }>();

  return {
    issue: (ticketed: Ticketed): string => {
      for (const [ticket, entry] of held) {
        if (entry.until <= now() || held.size >= MOST_TICKETS) {
          held.delete(ticket);
        }
      }

      const ticket = randomBytes(32).toString('base64url');

      held.set(ticket, { ...ticketed, until: now() + TICKET_LASTS_MS });

      return ticket;
    },

    read: (ticket: string): Ticketed | null => {
      const entry = held.get(ticket);

      return entry === undefined || entry.until <= now() ? null : entry;
    },
  };
};

type DirectTickets = ReturnType<typeof createDirectTickets>;

export type { DirectTickets, Ticketed };

export { createDirectTickets };

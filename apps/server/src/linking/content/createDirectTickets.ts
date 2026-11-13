import { randomBytes } from 'node:crypto';

type Ticketed = { serverId: string; route: string; isWhole: boolean; subjectId: string };

const TICKET_LASTS_MS = 6 * 60 * 60 * 1000;

const MOST_TICKETS = 20_000;

const MOST_EACH = 500;

/**
 * Tickets that let a player with no session here stream straight from this server: one on a linked
 * server's people's devices rather than through theirs, or a device being cast to. Each is good for
 * one session's manifest and segments, or one title's file, for a few hours, and is the only thing a
 * request needs to carry, since the player cannot sign anything. Held in memory, since a session
 * ends with a restart anyway. Whoever asks for one past their share has their own oldest dropped to
 * make room, so nobody asking over and over can stop somebody else's cast.
 *
 * @param now - The clock.
 * @returns The tickets.
 */
const createDirectTickets = <T extends object = Ticketed>(now: () => number = Date.now) => {
  const held = new Map<string, T & { until: number; owner: string }>();

  const dropTheOldest = (isTheirs: (owner: string) => boolean) => {
    for (const [ticket, entry] of held) {
      if (isTheirs(entry.owner)) {
        held.delete(ticket);

        return;
      }
    }
  };

  return {
    issue: (ticketed: T, owner: string): string => {
      let theirs = 0;

      for (const [ticket, entry] of held) {
        if (entry.until <= now()) {
          held.delete(ticket);
        } else if (entry.owner === owner) {
          theirs += 1;
        }
      }

      if (theirs >= MOST_EACH) {
        dropTheOldest((one) => one === owner);
      }

      if (held.size >= MOST_TICKETS) {
        dropTheOldest(() => true);
      }

      const ticket = randomBytes(32).toString('base64url');

      held.set(ticket, { ...ticketed, until: now() + TICKET_LASTS_MS, owner });

      return ticket;
    },

    read: (ticket: string): T | null => {
      const entry = held.get(ticket);

      return entry === undefined || entry.until <= now() ? null : entry;
    },
  };
};

type DirectTickets = ReturnType<typeof createDirectTickets<Ticketed>>;

export type { DirectTickets, Ticketed };

export { createDirectTickets };

import { randomBytes } from 'node:crypto';

type ConnectTicket = {
  accountId: string;
  profileId: string;
  pluginId: string;
  provider: string;
  returnTo: string;
};

type CreateConnectTicketsOptions = {
  now?: () => number;
  random?: (bytes: number) => Buffer;
};

const TICKET_FOR_MILLISECONDS = 5 * 60 * 1000;

/**
 * Hands out one-use tickets that let a browser with no Valence session — the system browser a phone
 * opens — start connecting an account for the person who asked. Each ticket names the account, the
 * profile, the plugin and the provider it was given for, lasts five minutes, and is spent the first
 * time anybody presents it, whether or not it matches.
 *
 * @param options - The clock and the source of randomness, for tests.
 * @returns How to issue a ticket and how to redeem one.
 */
const createConnectTickets = ({
  now = Date.now,
  random = randomBytes,
}: CreateConnectTicketsOptions = {}) => {
  const tickets = new Map<string, ConnectTicket & { expiresAt: number }>();

  const forget = (): void => {
    for (const [token, ticket] of tickets) {
      if (ticket.expiresAt < now()) {
        tickets.delete(token);
      }
    }
  };

  return {
    issue: (ticket: ConnectTicket): string => {
      forget();

      const token = random(24).toString('base64url');

      tickets.set(token, { ...ticket, expiresAt: now() + TICKET_FOR_MILLISECONDS });

      return token;
    },
    redeem: (token: string, pluginId: string, provider: string): ConnectTicket | null => {
      forget();

      const ticket = tickets.get(token);

      tickets.delete(token);

      if (ticket === undefined || ticket.pluginId !== pluginId || ticket.provider !== provider) {
        return null;
      }

      return {
        accountId: ticket.accountId,
        profileId: ticket.profileId,
        pluginId: ticket.pluginId,
        provider: ticket.provider,
        returnTo: ticket.returnTo,
      };
    },
  };
};

export { createConnectTickets };
export type { ConnectTicket };

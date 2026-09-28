import { describe, expect, it } from 'vitest';
import { createConnectTickets } from './createConnectTickets';

const TICKET = {
  accountId: 'account-1',
  profileId: 'profile-1',
  pluginId: 'anilist-sync',
  provider: 'anilist',
  returnTo: '/?account=plugin.anilist-sync.settings',
};

const build = () => {
  let clock = 1_000_000;
  let counter = 0;
  const tickets = createConnectTickets({
    now: () => clock,
    random: (bytes) => Buffer.alloc(bytes, (counter += 1)),
  });

  return {
    tickets,
    wait: (milliseconds: number) => {
      clock += milliseconds;
    },
  };
};

describe('createConnectTickets', () => {
  it('gives back who asked, once', () => {
    const { tickets } = build();
    const token = tickets.issue(TICKET);

    expect(tickets.redeem(token, 'anilist-sync', 'anilist')).toEqual(TICKET);
    expect(tickets.redeem(token, 'anilist-sync', 'anilist')).toBeNull();
  });

  it('refuses a ticket shown for another plugin or provider, and spends it', () => {
    const { tickets } = build();
    const first = tickets.issue(TICKET);
    const second = tickets.issue(TICKET);

    expect(tickets.redeem(first, 'another-plugin', 'anilist')).toBeNull();
    expect(tickets.redeem(first, 'anilist-sync', 'anilist')).toBeNull();
    expect(tickets.redeem(second, 'anilist-sync', 'spotify')).toBeNull();
    expect(tickets.redeem(second, 'anilist-sync', 'anilist')).toBeNull();
  });

  it('refuses a ticket after five minutes', () => {
    const { tickets, wait } = build();
    const token = tickets.issue(TICKET);

    wait(5 * 60 * 1000 + 1);

    expect(tickets.redeem(token, 'anilist-sync', 'anilist')).toBeNull();
  });

  it('refuses a ticket it never issued', () => {
    expect(build().tickets.redeem('made-up', 'anilist-sync', 'anilist')).toBeNull();
  });

  it('issues a different ticket each time', () => {
    const { tickets } = build();

    expect(tickets.issue(TICKET)).not.toBe(tickets.issue(TICKET));
  });
});

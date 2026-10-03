import { describe, expect, it } from 'vitest';
import { createDirectTickets } from './createDirectTickets';

const A_SESSION = { serverId: 'films', route: '/api/playback/session/one', isWhole: false };

const HOUR_MS = 60 * 60 * 1000;

describe('createDirectTickets', () => {
  it('reads back what a ticket was issued for, under a ticket nobody could guess', () => {
    const tickets = createDirectTickets();
    const ticket = tickets.issue(A_SESSION);

    expect(ticket).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(tickets.read(ticket)).toMatchObject(A_SESSION);
    expect(tickets.read('not-a-ticket')).toBeNull();
    expect(tickets.issue(A_SESSION)).not.toBe(ticket);
  });

  it('lets a ticket run out after a few hours', () => {
    let now = 0;
    const tickets = createDirectTickets(() => now);
    const ticket = tickets.issue(A_SESSION);

    now = 5 * HOUR_MS;

    expect(tickets.read(ticket)).not.toBeNull();

    now = 6 * HOUR_MS;

    expect(tickets.read(ticket)).toBeNull();
  });
});

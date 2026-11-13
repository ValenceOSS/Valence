import { describe, expect, it } from 'vitest';
import { createDirectTickets } from './createDirectTickets';

const A_SESSION = {
  serverId: 'films',
  route: '/api/playback/session/one',
  isWhole: false,
  subjectId: 'one',
};

const HOUR_MS = 60 * 60 * 1000;

describe('createDirectTickets', () => {
  it('reads back what a ticket was issued for, under a ticket nobody could guess', () => {
    const tickets = createDirectTickets();
    const ticket = tickets.issue(A_SESSION, 'films');

    expect(ticket).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(tickets.read(ticket)).toMatchObject(A_SESSION);
    expect(tickets.read('not-a-ticket')).toBeNull();
    expect(tickets.issue(A_SESSION, 'films')).not.toBe(ticket);
  });

  it('lets a ticket run out after a few hours', () => {
    let now = 0;
    const tickets = createDirectTickets(() => now);
    const ticket = tickets.issue(A_SESSION, 'films');

    now = 5 * HOUR_MS;

    expect(tickets.read(ticket)).not.toBeNull();

    now = 6 * HOUR_MS;

    expect(tickets.read(ticket)).toBeNull();
  });

  it('makes room for somebody’s new ticket out of their own, never anybody else’s', () => {
    const tickets = createDirectTickets();
    const theirs = tickets.issue(A_SESSION, 'anime');
    const mine = Array.from({ length: 501 }, () => tickets.issue(A_SESSION, 'films'));

    expect(tickets.read(theirs)).not.toBeNull();
    expect(tickets.read(mine[0] ?? '')).toBeNull();
    expect(tickets.read(mine[1] ?? '')).not.toBeNull();
    expect(tickets.read(mine.at(-1) ?? '')).not.toBeNull();
  });
});

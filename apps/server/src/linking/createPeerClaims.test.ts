import { describe, expect, it } from 'vitest';
import { createPeerClaims } from './createPeerClaims';

const ARRIVAL = { mediaId: 'arrival', title: 'Arrival' };

describe('createPeerClaims', () => {
  it('reaches a session only from the server that started it, saying of which title', () => {
    const claims = createPeerClaims();

    claims.claim('session', 'one', 'films', ARRIVAL);

    expect(claims.claimedBy('session', 'one', 'films')).toEqual(ARRIVAL);
    expect(claims.claimedBy('session', 'one', 'books')).toBeNull();
    expect(claims.claimedBy('trickplay', 'one', 'films')).toBeNull();
  });

  it('keeps a session claimed twice until it is released twice', () => {
    const claims = createPeerClaims();

    claims.claim('session', 'one', 'films', ARRIVAL);
    claims.claim('session', 'one', 'films', ARRIVAL);
    claims.release('session', 'one', 'films');

    expect(claims.claimedBy('session', 'one', 'films')).toEqual(ARRIVAL);

    claims.release('session', 'one', 'films');

    expect(claims.claimedBy('session', 'one', 'films')).toBeNull();
  });

  it('counts the sessions one server has going', () => {
    const claims = createPeerClaims();

    claims.claim('session', 'one', 'films', ARRIVAL);
    claims.claim('session', 'two', 'films', ARRIVAL);
    claims.claim('session', 'three', 'books', ARRIVAL);
    claims.claim('trickplay', 'one', 'films', ARRIVAL);

    expect(claims.countOf('session', 'films')).toBe(2);
    expect(claims.countOf('session', 'books')).toBe(1);
  });
});

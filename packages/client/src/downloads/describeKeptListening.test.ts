import { describe, expect, it } from 'vitest';
import type { KeptListeningStanding } from '@ValenceClient/downloads/standingOfKeptListening';
import { describeKeptListening } from './describeKeptListening';

/**
 * Something three songs in of twelve.
 *
 * @param state - How it stands.
 * @returns How far it has got.
 */
const standing = (state: KeptListeningStanding['state']): KeptListeningStanding => ({
  state,
  filesHere: 3,
  filesInAll: 12,
  bytes: 1000,
  failure: null,
});

describe('describeKeptListening', () => {
  it('says it is downloaded, and offers to remove it', () => {
    expect(describeKeptListening(standing('here'))).toEqual({ says: 'Downloaded', next: 'remove' });
  });

  it('counts the songs while they arrive, and offers to pause', () => {
    expect(describeKeptListening(standing('fetching'))).toEqual({
      says: 'Downloading 3 of 12',
      next: 'pause',
    });
  });

  it('says where it stopped where a song could not be fetched, and offers to carry on', () => {
    expect(describeKeptListening(standing('failed'))).toEqual({
      says: 'Stopped at 3 of 12',
      next: 'carryOn',
    });
  });

  it('says where it was paused, and offers to carry on', () => {
    expect(describeKeptListening(standing('paused'))).toEqual({
      says: 'Paused at 3 of 12',
      next: 'carryOn',
    });
  });
});

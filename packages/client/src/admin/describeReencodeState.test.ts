import { describe, expect, it } from 'vitest';
import { REENCODE_STATES } from '@ValenceContracts/schemas/Reencode';
import { describeReencodeState } from './describeReencodeState';

describe('describeReencodeState', () => {
  it('has words for every state a re-encode can be in', () => {
    for (const state of REENCODE_STATES) {
      expect(describeReencodeState(state)).toBeTruthy();
    }
  });

  it('never answers with the state name it was given', () => {
    for (const state of REENCODE_STATES) {
      expect(describeReencodeState(state)).not.toBe(state);
    }
  });

  it('says a waiting encode is waiting for somebody, not merely waiting', () => {
    expect(describeReencodeState('awaitingReview')).toContain('you');
  });

  it('says what a rejection did, since the point is that nothing was lost', () => {
    expect(describeReencodeState('rejected')).toContain('original');
  });
});

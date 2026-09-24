import { describe, expect, it } from 'vitest';
import { describeTestRound } from './describeTestRound';

describe('describeTestRound', () => {
  it('says all answered where none failed', () => {
    expect(
      describeTestRound([
        { name: 'Jackett', failure: null },
        { name: 'Prowlarr', failure: null },
      ]),
    ).toEqual({ done: 'All 2 answered.', failure: null });
  });

  it('names the one indexer where only one was tested', () => {
    expect(describeTestRound([{ name: 'Jackett', failure: null }])).toEqual({
      done: 'Jackett answered.',
      failure: null,
    });
  });

  it('counts those that answered and says why each of the rest did not', () => {
    expect(
      describeTestRound([
        { name: 'Jackett', failure: null },
        { name: 'Prowlarr', failure: 'Prowlarr: Timed out' },
        { name: 'Torrents', failure: 'Torrents: did not answer' },
      ]).failure,
    ).toBe('1 of 3 answered. Prowlarr: Timed out; Torrents: did not answer');
  });

  it('gives a lone failure as it is', () => {
    expect(describeTestRound([{ name: 'Jackett', failure: 'Jackett: Timed out' }]).failure).toBe(
      'Jackett: Timed out',
    );
  });
});

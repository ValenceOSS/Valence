import { describe, expect, it } from 'vitest';
import { seededShuffle } from './seededShuffle';

const NUMBERS = Array.from({ length: 40 }, (_, at) => at);

describe('seededShuffle', () => {
  it('puts the same things in the same order for the same seed', () => {
    expect(seededShuffle(NUMBERS, 'pat:20000')).toEqual(seededShuffle(NUMBERS, 'pat:20000'));
  });

  it('puts them in another order for another seed', () => {
    expect(seededShuffle(NUMBERS, 'pat:20001')).not.toEqual(seededShuffle(NUMBERS, 'pat:20000'));
  });

  it('keeps every one of them, and leaves what it was given alone', () => {
    const given = [...NUMBERS];

    const shuffled = seededShuffle(given, 'sam');

    expect([...shuffled].sort((one, other) => one - other)).toEqual(NUMBERS);
    expect(given).toEqual(NUMBERS);
  });

  it('copes with nothing to shuffle', () => {
    expect(seededShuffle([], 'pat')).toEqual([]);
  });
});

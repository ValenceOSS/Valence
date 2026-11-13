import { describe, expect, it } from 'vitest';
import { keepRecent } from './keepRecent';

describe('keepRecent', () => {
  it('adds the newest reading to the end', () => {
    expect(keepRecent([1, 2], 3, 5)).toEqual([1, 2, 3]);
  });

  it('drops the oldest once the list is full', () => {
    expect(keepRecent([1, 2, 3], 4, 3)).toEqual([2, 3, 4]);
  });

  it('keeps nothing when told to keep nothing', () => {
    expect(keepRecent([1], 2, 0)).toEqual([]);
  });

  it('leaves the list it was given alone', () => {
    const list = [1, 2];

    keepRecent(list, 3, 2);

    expect(list).toEqual([1, 2]);
  });
});

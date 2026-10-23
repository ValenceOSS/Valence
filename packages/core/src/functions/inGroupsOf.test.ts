import { describe, expect, it } from 'vitest';
import { inGroupsOf } from '@ValenceCore/functions/inGroupsOf';

describe('inGroupsOf', () => {
  it('splits a list into groups of the size asked, the last holding what is left', () => {
    expect(inGroupsOf([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('keeps a list no longer than the size as one group', () => {
    expect(inGroupsOf(['a', 'b'], 2)).toEqual([['a', 'b']]);
  });

  it('has no groups for nothing', () => {
    expect(inGroupsOf([], 3)).toEqual([]);
  });
});

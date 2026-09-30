import { describe, expect, it } from 'vitest';
import { sayCountParts } from './sayCountParts';

describe('sayCountParts', () => {
  it('says one in the form for one, with the filling where the number goes', () => {
    const number = { kind: 'number' };

    expect(sayCountParts('common.count.songs', 1, { count: number })).toEqual([number, ' song']);
  });

  it('says several in the form for several', () => {
    expect(sayCountParts('common.count.songs', 3, { count: '3' })).toEqual(['3', ' songs']);
  });
});

import { describe, expect, it } from 'vitest';
import { fillGaps } from './fillGaps';

describe('fillGaps', () => {
  it('fills each gap from what is given, and leaves a gap with nothing given as written', () => {
    expect(fillGaps('{count} of {total}', { count: 3 })).toBe('3 of {total}');
  });
});

import { describe, expect, it } from 'vitest';
import { UNNUMBERED_SEASON } from './UNNUMBERED_SEASON';

describe('UNNUMBERED_SEASON', () => {
  it('is the largest number four digits hold, which no real season reaches', () => {
    expect(UNNUMBERED_SEASON).toBe(0xffff);
  });
});

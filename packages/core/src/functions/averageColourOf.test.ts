import { describe, expect, it } from 'vitest';
import { averageColourOf } from './averageColourOf';

describe('averageColourOf', () => {
  it('averages the red, green and blue of every pixel, leaving how opaque aside', () => {
    expect(averageColourOf([0, 100, 200, 255, 100, 200, 0, 10])).toEqual([50, 150, 100]);
  });

  it('has no colour where there are no pixels', () => {
    expect(averageColourOf([])).toBeNull();
  });
});

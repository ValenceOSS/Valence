import { describe, expect, it } from 'vitest';
import { segmentsLitAt } from './segmentsLitAt';

describe('segmentsLitAt', () => {
  it('lights one more segment on each tick until the ring is full', () => {
    expect(segmentsLitAt(0, 8)).toEqual({ from: 0, lit: 1 });
    expect(segmentsLitAt(7, 8)).toEqual({ from: 0, lit: 8 });
  });

  it('then goes dark from where it began', () => {
    expect(segmentsLitAt(8, 8)).toEqual({ from: 1, lit: 8 });
    expect(segmentsLitAt(14, 8)).toEqual({ from: 7, lit: 8 });
  });

  it('goes round again', () => {
    expect(segmentsLitAt(16, 8)).toEqual(segmentsLitAt(0, 8));
  });
});

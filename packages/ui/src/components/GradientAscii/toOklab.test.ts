import { describe, expect, it } from 'vitest';
import { toOklab } from './toOklab';

describe('toOklab', () => {
  it('puts white at full lightness with no colour', () => {
    const [l, a, b] = toOklab('#ffffff');

    expect(l).toBeCloseTo(1, 3);
    expect(a).toBeCloseTo(0, 3);
    expect(b).toBeCloseTo(0, 3);
  });

  it('puts black at no lightness', () => {
    expect(toOklab('#000000')[0]).toBeCloseTo(0, 5);
  });

  it('leans a blue towards blue on the second colour axis', () => {
    expect(toOklab('#0066ff')[2]).toBeLessThan(0);
  });
});

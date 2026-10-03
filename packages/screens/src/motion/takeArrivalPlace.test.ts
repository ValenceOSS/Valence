import { describe, expect, it } from 'vitest';
import { takeArrivalPlace } from './takeArrivalPlace';

describe('takeArrivalPlace', () => {
  it('lines up things arriving together, one after another', () => {
    const batch = { size: 0, lastAt: -Infinity };

    expect(takeArrivalPlace(batch, 1000)).toBe(0);
    expect(takeArrivalPlace(batch, 1010)).toBe(1);
    expect(takeArrivalPlace(batch, 1020)).toBe(2);
  });

  it('starts a fresh line for a wave that comes after a pause', () => {
    const batch = { size: 0, lastAt: -Infinity };

    takeArrivalPlace(batch, 1000);
    takeArrivalPlace(batch, 1010);

    expect(takeArrivalPlace(batch, 2000)).toBe(0);
  });

  it('takes several places at once for something that brings in several pieces', () => {
    const batch = { size: 0, lastAt: -Infinity };

    expect(takeArrivalPlace(batch, 1000, 4)).toBe(0);
    expect(takeArrivalPlace(batch, 1005)).toBe(4);
  });
});

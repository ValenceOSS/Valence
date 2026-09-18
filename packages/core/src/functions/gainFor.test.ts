import { describe, expect, it } from 'vitest';
import { gainFor } from './gainFor';

describe('gainFor', () => {
  it('is silent at the bottom and full at the top', () => {
    expect(gainFor(0)).toBe(0);
    expect(gainFor(1)).toBe(1);
  });

  it('plays the middle of the control well below half the gain, as hearing expects', () => {
    expect(gainFor(0.5)).toBeCloseTo(0.125);
  });

  it('never gets louder as the control goes down', () => {
    const levels = Array.from({ length: 11 }, (_, at) => gainFor(at / 10));

    expect([...levels].sort((one, other) => one - other)).toEqual(levels);
  });

  it('keeps a control out of range within what a media element accepts', () => {
    expect(gainFor(-1)).toBe(0);
    expect(gainFor(2)).toBe(1);
  });
});

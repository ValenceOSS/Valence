import { describe, expect, it } from 'vitest';
import { compareToOriginal } from './compareToOriginal';

describe('compareToOriginal', () => {
  it('puts a rung against the file it came from', () => {
    expect(compareToOriginal(2_000_000_000, 8_000_000_000)).toBe('about a quarter of the original');
  });

  it('makes the case for a remux, where the arithmetic is the argument', () => {
    expect(compareToOriginal(4_000_000_000, 60_000_000_000)).toBe(
      'a small fraction of the original — about a 15th',
    );
  });

  it('says two-thirds where the rung is two-thirds, rather than rounding it down to half', () => {
    expect(compareToOriginal(282_000_000, 429_000_000)).toBe('about two-thirds of the original');
  });

  it('says three-quarters where it is three-quarters', () => {
    expect(compareToOriginal(6_000_000_000, 8_000_000_000)).toBe(
      'about three-quarters of the original',
    );
  });

  it('still says half where it is half', () => {
    expect(compareToOriginal(197_000_000, 429_000_000)).toBe('about half the size of the original');
  });

  it('says nothing where a rung is no smaller, since there is no case to make', () => {
    expect(compareToOriginal(8_000_000_000, 8_000_000_000)).toBeNull();
    expect(compareToOriginal(9_000_000_000, 8_000_000_000)).toBeNull();
  });

  it('says nothing where the original has no size to compare against', () => {
    expect(compareToOriginal(4_000_000_000, 0)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { savesEnough } from './savesEnough';

describe('savesEnough', () => {
  it('is worth making where it comes in well under the original', () => {
    expect(savesEnough(282_000_000, 429_000_000)).toBe(true);
  });

  it('is not worth making where it would be larger than the original', () => {
    expect(savesEnough(704_000_000, 429_000_000)).toBe(false);
  });

  it('is not worth a generation of quality to save less than a tenth', () => {
    expect(savesEnough(400_000_000, 429_000_000)).toBe(false);
    expect(savesEnough(386_100_000, 429_000_000)).toBe(true);
  });
});

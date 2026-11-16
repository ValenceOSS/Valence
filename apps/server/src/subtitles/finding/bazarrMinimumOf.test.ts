import { describe, expect, it } from 'vitest';
import { bazarrMinimumOf } from './bazarrMinimumOf';

describe('bazarrMinimumOf', () => {
  it('keeps what each old level meant', () => {
    expect(bazarrMinimumOf(100, 'film')).toBe(100);
    expect(bazarrMinimumOf(80, 'episode')).toBe(98);
    expect(bazarrMinimumOf(60, 'film')).toBe(90);
    expect(bazarrMinimumOf(0, 'episode')).toBe(0);
  });

  it('gives a score below a close match Bazarr’s default for its kind', () => {
    expect(bazarrMinimumOf(30, 'film')).toBe(70);
    expect(bazarrMinimumOf(30, 'episode')).toBe(90);
  });
});

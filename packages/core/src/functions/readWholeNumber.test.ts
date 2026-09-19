import { describe, expect, it } from 'vitest';
import { readWholeNumber } from './readWholeNumber';

describe('readWholeNumber', () => {
  it('reads a whole number in range, spaces and all', () => {
    expect(readWholeNumber(' 25 ', 1, 50)).toBe(25);
    expect(readWholeNumber('1', 1, 50)).toBe(1);
    expect(readWholeNumber('50', 1, 50)).toBe(50);
  });

  it('refuses nothing, a fraction, a word, and anything out of range', () => {
    expect(readWholeNumber('  ', 1, 50)).toBeNull();
    expect(readWholeNumber('2.5', 1, 50)).toBeNull();
    expect(readWholeNumber('ten', 1, 50)).toBeNull();
    expect(readWholeNumber('0', 1, 50)).toBeNull();
    expect(readWholeNumber('51', 1, 50)).toBeNull();
  });
});

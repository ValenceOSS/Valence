import { describe, expect, it } from 'vitest';
import { readNumber } from './readNumber';

describe('readNumber', () => {
  it.each([
    ['42', false, 42],
    ['1,024.4 MB', false, 1024.4],
    ['1.024,4 MB', false, 1024.4],
    ['1,5 GB', false, 1.5],
    ['1,234 GB', false, 1234],
    ['1.234 GB', false, 1.234],
    ['1.234', true, 1234],
    ['1.234.567', true, 1_234_567],
    ['12 seeders', true, 12],
    ['3.9', true, 3],
    ['-5', true, -5],
    ['0.5', false, 0.5],
  ])('reads %s as %s', (text, isWhole, expected) => {
    expect(readNumber(text, isWhole)).toBe(expected);
  });

  it('reads nothing where there is no number', () => {
    expect(readNumber('-')).toBeNull();
    expect(readNumber('n/a')).toBeNull();
    expect(readNumber('')).toBeNull();
  });
});

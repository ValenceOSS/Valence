import { describe, expect, it } from 'vitest';
import { readWholeNumber } from './readWholeNumber';

describe('readWholeNumber', () => {
  it('reads a whole number, with a sign and spaces around it', () => {
    expect([readWholeNumber('02'), readWholeNumber(' +3 '), readWholeNumber('-4')]).toEqual([
      2, 3, -4,
    ]);
  });

  it('reads nothing from what is not one, or is too large to hold', () => {
    expect([readWholeNumber('02a'), readWholeNumber(''), readWholeNumber(undefined)]).toEqual([
      null,
      null,
      null,
    ]);
    expect(readWholeNumber('99999999999')).toBeNull();
  });
});

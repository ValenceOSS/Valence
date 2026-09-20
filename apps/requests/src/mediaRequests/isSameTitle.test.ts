import { describe, expect, it } from 'vitest';
import { isSameTitle } from './isSameTitle';

describe('isSameTitle', () => {
  it('sees past punctuation, case, accents and ampersands', () => {
    expect(
      isSameTitle('Mission Impossible Dead Reckoning', 'Mission: Impossible – Dead Reckoning'),
    ).toBe(true);
    expect(isSameTitle('Amelie', 'Amélie')).toBe(true);
    expect(isSameTitle('Law and Order', 'Law & Order')).toBe(true);
    expect(isSameTitle('Schindlers List', "Schindler's List")).toBe(true);
    expect(isSameTitle('Office', 'The Office')).toBe(true);
    expect(isSameTitle('Doctor Who', 'Doctor Who (2005)')).toBe(true);
  });

  it('tells different titles apart', () => {
    expect(isSameTitle('Dune Part Two', 'Dune')).toBe(false);
    expect(isSameTitle('', 'Dune')).toBe(false);
  });
});

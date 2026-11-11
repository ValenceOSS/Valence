import { describe, expect, it } from 'vitest';
import { ageOn } from './ageOn';

describe('ageOn', () => {
  it('counts the years somebody has lived', () => {
    expect(ageOn('1974-08-20', new Date(2026, 9, 1))).toBe(52);
  });

  it('counts a year short until their birthday comes round', () => {
    expect(ageOn('1974-08-20', new Date(2026, 7, 5))).toBe(51);
    expect(ageOn('1974-08-20', new Date(2026, 2, 1))).toBe(51);
  });

  it('counts the year once the month of their birthday has passed', () => {
    expect(ageOn('1974-08-20', new Date(2026, 8, 1))).toBe(52);
  });

  it('says nothing where a date could not be read', () => {
    expect(ageOn('the seventies', new Date(2026, 9, 1))).toBeNull();
    expect(ageOn('1974-08-20', new Date('not a day'))).toBeNull();
  });
});

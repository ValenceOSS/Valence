import { describe, expect, it } from 'vitest';
import { readAirDate } from './readAirDate';

describe('readAirDate', () => {
  it('reads a date written year first or day first', () => {
    expect(readAirDate('2017.04.20')).toEqual({ year: 2017, month: 4, day: 20 });
    expect(readAirDate('20-04-2017')).toEqual({ year: 2017, month: 4, day: 20 });
  });

  it('reads nothing where the separators disagree or the day does not exist', () => {
    expect(readAirDate('2017.04-20')).toBeNull();
    expect(readAirDate('2017-02-30')).toBeNull();
  });
});

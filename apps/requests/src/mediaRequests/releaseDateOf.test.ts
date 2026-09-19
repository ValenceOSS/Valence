import { describe, expect, it } from 'vitest';
import { releaseDateOf } from './releaseDateOf';

const DATES = { theatrical: '2021-10-22', digital: '2021-12-03', physical: '2022-01-11' };

describe('releaseDateOf', () => {
  it('holds a film until it is out in the way the admin chose', () => {
    expect(releaseDateOf({ kind: 'film', waitFor: 'digital', releaseDates: DATES })).toBe(
      '2021-12-03',
    );
    expect(releaseDateOf({ kind: 'film', waitFor: 'physical', releaseDates: DATES })).toBe(
      '2022-01-11',
    );
  });

  it('takes the other release at home where the chosen one is not known', () => {
    expect(
      releaseDateOf({
        kind: 'film',
        waitFor: 'digital',
        releaseDates: { ...DATES, digital: null },
      }),
    ).toBe('2022-01-11');
  });

  it('counts three months from cinemas where neither is known', () => {
    expect(
      releaseDateOf({
        kind: 'film',
        waitFor: 'digital',
        releaseDates: { theatrical: '2021-10-22', digital: null, physical: null },
      }),
    ).toBe('2022-01-20');
  });

  it('holds nothing it knows no date for, and no series as a whole', () => {
    expect(
      releaseDateOf({
        kind: 'film',
        waitFor: 'digital',
        releaseDates: { theatrical: null, digital: null, physical: null },
      }),
    ).toBeNull();
    expect(releaseDateOf({ kind: 'series', waitFor: 'digital', releaseDates: DATES })).toBeNull();
  });
});

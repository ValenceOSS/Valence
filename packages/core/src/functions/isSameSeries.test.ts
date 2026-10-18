import { describe, expect, it } from 'vitest';
import { isSameSeries } from './isSameSeries';

describe('isSameSeries', () => {
  it('goes by the programme where both know which it is', () => {
    expect(
      isSameSeries({ seriesId: 'a', seriesTitle: 'Show' }, { seriesId: 'a', seriesTitle: 'Show' }),
    ).toBe(true);
  });

  it('keeps apart two programmes that share a name', () => {
    expect(
      isSameSeries({ seriesId: 'a', seriesTitle: 'Show' }, { seriesId: 'b', seriesTitle: 'Show' }),
    ).toBe(false);
  });

  it('goes by the name where one arrived knowing only that', () => {
    expect(
      isSameSeries({ seriesId: null, seriesTitle: 'Show' }, { seriesId: 'a', seriesTitle: 'Show' }),
    ).toBe(true);
    expect(
      isSameSeries(
        { seriesId: null, seriesTitle: 'Show' },
        { seriesId: 'a', seriesTitle: 'Other' },
      ),
    ).toBe(false);
  });

  it('puts nothing with no programme in one with anything', () => {
    expect(
      isSameSeries({ seriesId: null, seriesTitle: null }, { seriesId: null, seriesTitle: null }),
    ).toBe(false);
  });
});

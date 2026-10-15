import { describe, expect, it } from 'vitest';
import { readContentAdvice } from './readContentAdvice';

describe('readContentAdvice', () => {
  it('reads what a film contains from the descriptors beside each release, per country', () => {
    expect(
      readContentAdvice({
        release_dates: {
          results: [
            {
              iso_3166_1: 'gb',
              release_dates: [{ descriptors: ['Strong Language'] }, { descriptors: ['Violence'] }],
            },
            { iso_3166_1: 'US', release_dates: [{ descriptors: [] }] },
          ],
        },
      }),
    ).toEqual({ GB: ['violence', 'language'] });
  });

  it('reads a programme’s from its ratings', () => {
    expect(
      readContentAdvice({
        content_ratings: { results: [{ iso_3166_1: 'BR', descriptors: ['Drogas', 'Drug Use'] }] },
      }),
    ).toEqual({ BR: ['drugs'] });
  });

  it('reads nothing from a catalogue that said nothing', () => {
    expect(readContentAdvice({})).toEqual({});
  });
});

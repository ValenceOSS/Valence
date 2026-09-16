import { describe, expect, it } from 'vitest';
import { readCertifications } from './readCertifications';

describe('collecting the certificates a catalogue holds', () => {
  it('reads a programme, which carries one rating per country', () => {
    expect(
      readCertifications({
        content_ratings: {
          results: [
            { iso_3166_1: 'GB', rating: '15' },
            { iso_3166_1: 'US', rating: 'TV-MA' },
          ],
        },
      }),
    ).toEqual({ GB: '15', US: 'TV-MA' });
  });

  it('reads a film, which carries releases and a certificate on some of them', () => {
    expect(
      readCertifications({
        release_dates: {
          results: [
            { iso_3166_1: 'GB', release_dates: [{ certification: '12A' }] },
            { iso_3166_1: 'US', release_dates: [{ certification: 'PG-13' }] },
          ],
        },
      }),
    ).toEqual({ GB: '12A', US: 'PG-13' });
  });

  it('takes the first release that names anything, a country often having several', () => {
    expect(
      readCertifications({
        release_dates: {
          results: [
            {
              iso_3166_1: 'GB',
              release_dates: [
                { certification: '' },
                { certification: '15' },
                { certification: '18' },
              ],
            },
          ],
        },
      }),
    ).toEqual({ GB: '15' });
  });

  it('leaves out a country that named none', () => {
    expect(
      readCertifications({
        release_dates: {
          results: [
            { iso_3166_1: 'GB', release_dates: [{ certification: '  ' }] },
            { iso_3166_1: 'FR', release_dates: [{ certification: '12' }] },
          ],
        },
      }),
    ).toEqual({ FR: '12' });
  });

  it('leaves out a country with no releases at all', () => {
    expect(readCertifications({ release_dates: { results: [{ iso_3166_1: 'GB' }] } })).toEqual({});
  });

  it('says nothing where the catalogue answered with neither', () => {
    expect(readCertifications({})).toEqual({});
  });

  it('says nothing where both came back empty', () => {
    expect(readCertifications({ release_dates: {}, content_ratings: {} })).toEqual({});
  });

  it('names countries the same way whatever case they arrived in', () => {
    expect(
      readCertifications({ content_ratings: { results: [{ iso_3166_1: 'gb', rating: '15' }] } }),
    ).toEqual({ GB: '15' });
  });

  it('lets a film’s certificate win where something answered as both', () => {
    expect(
      readCertifications({
        content_ratings: { results: [{ iso_3166_1: 'GB', rating: 'TV-14' }] },
        release_dates: {
          results: [{ iso_3166_1: 'GB', release_dates: [{ certification: '15' }] }],
        },
      }),
    ).toEqual({ GB: '15' });
  });
});

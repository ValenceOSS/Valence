import { describe, expect, it } from 'vitest';
import { valuesOfCandidate } from './valuesOfCandidate';

const DESCRIBED = {
  title: 'A film',
  year: 1999,
  overview: 'What it is about.',
  posterUrl: null,
  backdropUrl: null,
  genres: ['Drama'],
  runtimeMinutes: 120,
  cast: [],
  trailerKey: null,
};

describe('valuesOfCandidate', () => {
  it('reads each field the catalogue fills, empty ones as nothing', () => {
    expect(
      valuesOfCandidate({
        ...DESCRIBED,
        tagline: 'A line.',
        studios: [],
        certifications: { GB: '15' },
        rating: 7,
        imdbId: 'tt0000001',
        trailerKey: 'abcdefghijk',
        cast: [{ personId: 4, name: 'Someone', role: null, photoUrl: null }],
      }),
    ).toEqual({
      title: 'A film',
      originalTitle: null,
      tagline: 'A line.',
      overview: 'What it is about.',
      releaseDate: null,
      status: null,
      genres: ['Drama'],
      studios: null,
      networks: null,
      certifications: { GB: '15' },
      rating: 7,
      imdbId: 'tt0000001',
      tvdbId: null,
      trailer: 'abcdefghijk',
      cast: [{ personId: 4, name: 'Someone', role: '', imageUrl: null }],
    });
  });

  it('leaves out what matching does not change', () => {
    const values = valuesOfCandidate(DESCRIBED);

    expect(Object.keys(values)).not.toContain('sortTitle');
    expect(Object.keys(values)).not.toContain('note');
    expect(Object.keys(values)).not.toContain('tags');
  });
});

import { describe, expect, it } from 'vitest';
import { withBazarrScores } from './withBazarrScores';

describe('withBazarrScores', () => {
  it('keeps what each old level meant', () => {
    expect(withBazarrScores({ filmMinimumScore: 100, episodeMinimumScore: 80 })).toEqual({
      filmMinimumScore: 100,
      episodeMinimumScore: 98,
      scale: 'bazarr',
    });
    expect(withBazarrScores({ filmMinimumScore: 60, episodeMinimumScore: 0 })).toEqual({
      filmMinimumScore: 90,
      episodeMinimumScore: 0,
      scale: 'bazarr',
    });
  });

  it('gives a minimum below a close match Bazarr’s default for its kind', () => {
    expect(withBazarrScores({ filmMinimumScore: 40, episodeMinimumScore: 50 })).toEqual({
      filmMinimumScore: 70,
      episodeMinimumScore: 90,
      scale: 'bazarr',
    });
  });

  it('keeps everything else, and moves settings only once', () => {
    const moved = withBazarrScores({ languages: ['en'], filmMinimumScore: 60 });

    expect(moved).toEqual({ languages: ['en'], filmMinimumScore: 90, scale: 'bazarr' });
    expect(withBazarrScores(moved)).toBe(moved);
  });

  it('passes over what is not settings', () => {
    expect(withBazarrScores(null)).toBeNull();
    expect(withBazarrScores('nothing')).toBe('nothing');
  });
});

import { describe, expect, it } from 'vitest';
import { discoverParameters } from '@ValenceServer/library/discoverParameters';

const TODAY = '2026-09-21';

describe('discoverParameters', () => {
  it('puts the most popular first, for a list that is not about what is coming', () => {
    expect(discoverParameters('popular', 'movie', {}, TODAY)).toEqual({
      sort_by: 'popularity.desc',
    });
  });

  it('puts what is coming soonest first, starting from today', () => {
    expect(discoverParameters('upcoming', 'movie', {}, TODAY)).toEqual({
      sort_by: 'primary_release_date.asc',
      'primary_release_date.gte': TODAY,
    });
  });

  it('dates a series by when it first aired', () => {
    expect(discoverParameters('upcoming', 'tv', {}, TODAY)).toEqual({
      sort_by: 'first_air_date.asc',
      'first_air_date.gte': TODAY,
    });
  });

  it('holds it to a genre', () => {
    expect(discoverParameters('popular', 'movie', { genre: '878' }, TODAY)).toMatchObject({
      with_genres: '878',
    });
  });

  it('holds it to a span of years, whole years from the first day to the last', () => {
    expect(
      discoverParameters('popular', 'movie', { yearFrom: 1990, yearTo: 1999 }, TODAY),
    ).toMatchObject({
      'primary_release_date.gte': '1990-01-01',
      'primary_release_date.lte': '1999-12-31',
    });
  });

  it('lets a span of years say where what is coming starts', () => {
    expect(
      discoverParameters('upcoming', 'movie', { yearFrom: 2030 }, TODAY)[
        'primary_release_date.gte'
      ],
    ).toBe('2030-01-01');
  });

  it('asks for enough votes to trust the rating it is held to', () => {
    expect(discoverParameters('popular', 'tv', { minRating: 8 }, TODAY)).toMatchObject({
      'vote_average.gte': '8',
      'vote_count.gte': '100',
    });
  });

  it('asks for nothing that was not asked for', () => {
    expect(Object.keys(discoverParameters('popular', 'tv', {}, TODAY))).toEqual(['sort_by']);
  });
});

import { describe, expect, it } from 'vitest';
import { releaseFactsOf } from '@ValenceServer/library/releaseFactsOf';

describe('releaseFactsOf', () => {
  it('reads a film’s release date, budget, revenue, status and id', () => {
    expect(
      releaseFactsOf(
        {
          release_date: '2021-09-15',
          budget: 165_000_000,
          revenue: 402_000_000,
          status: 'Released',
          imdb_id: 'tt1160419',
        },
        null,
      ),
    ).toEqual({
      releaseDate: '2021-09-15',
      budget: 165_000_000,
      revenue: 402_000_000,
      status: 'Released',
      imdbId: 'tt1160419',
    });
  });

  it('dates an episode by the day it aired, not by when the series began', () => {
    expect(releaseFactsOf({ first_air_date: '2022-02-18' }, '2022-03-04').releaseDate).toBe(
      '2022-03-04',
    );
  });

  it('dates a series by when it began where nothing more exact is known', () => {
    expect(releaseFactsOf({ first_air_date: '2022-02-18' }, null).releaseDate).toBe('2022-02-18');
  });

  it('leaves out a budget or revenue of nothing, which usually means nobody knows', () => {
    expect(releaseFactsOf({ budget: 0, revenue: 0 }, null)).toEqual({});
  });

  it('leaves out what is blank', () => {
    expect(releaseFactsOf({ release_date: '', status: '', imdb_id: '' }, null)).toEqual({});
    expect(releaseFactsOf({ imdb_id: null }, null)).toEqual({});
  });

  it('says nothing about a title it knows nothing of', () => {
    expect(releaseFactsOf({}, null)).toEqual({});
  });
});

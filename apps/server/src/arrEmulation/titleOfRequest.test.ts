import { describe, expect, it } from 'vitest';
import { titleOfRequest } from './titleOfRequest';
import { aSeerrRequest } from './testing/aSeerrRequest';

describe('titleOfRequest', () => {
  it('takes the title, year, overview and poster the request kept', () => {
    expect(titleOfRequest(aSeerrRequest())).toEqual({
      title: 'Arrival',
      year: 2016,
      overview: 'Linguist meets visitors.',
      posterUrl: 'https://image.tmdb.org/t/p/w342/arrival.jpg',
    });
  });
});

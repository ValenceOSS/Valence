import { pageInTheLibrary } from './pageInTheLibrary';

describe('pageInTheLibrary', () => {
  it('opens a film as its title and a series as the programme it became', () => {
    expect(pageInTheLibrary('film', 'dune')).toEqual({ kind: 'title', mediaId: 'dune' });
    expect(pageInTheLibrary('series', 'hearts')).toEqual({ kind: 'series', seriesId: 'hearts' });
  });
});

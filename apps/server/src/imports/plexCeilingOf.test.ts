import { describe, expect, it } from 'vitest';
import { plexCeilingOf } from './plexCeilingOf';

const NONE = { filterMovies: null, filterTelevision: null, restrictionProfile: null };

describe('plexCeilingOf', () => {
  it('has no ceiling for somebody unrestricted', () => {
    expect(plexCeilingOf(NONE, ['US'])).toBeNull();
    expect(plexCeilingOf({ ...NONE, filterMovies: 'label=kids' }, ['US'])).toBeNull();
  });

  it('reads an allow list as its oldest rating, keeping out what is unrated', () => {
    expect(
      plexCeilingOf({ ...NONE, filterMovies: 'contentRating=G%2CPG|label=kids' }, ['US']),
    ).toEqual({
      maximumAge: 8,
      allowsUnrated: false,
    });
  });

  it('reads a deny list as below its youngest rating, letting unrated through', () => {
    expect(plexCeilingOf({ ...NONE, filterTelevision: 'contentRating!=TV-MA' }, ['US'])).toEqual({
      maximumAge: 16,
      allowsUnrated: true,
    });
  });

  it('takes the stricter of film, television and a managed user’s profile', () => {
    expect(
      plexCeilingOf(
        {
          filterMovies: 'contentRating!=R',
          filterTelevision: null,
          restrictionProfile: 'little_kid',
        },
        ['US'],
      ),
    ).toEqual({ maximumAge: 0, allowsUnrated: false });
  });

  it('reads a filter that is not escaped', () => {
    expect(plexCeilingOf({ ...NONE, filterMovies: 'contentRating=PG-13%' }, ['US'])).toEqual({
      maximumAge: 0,
      allowsUnrated: false,
    });
  });
});

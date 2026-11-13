import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT } from '@ValenceServer/library/LibraryService';
import { itemsOptionsOf } from './itemsOptionsOf';

describe('itemsOptionsOf', () => {
  it('reads nothing asked as the first page at the usual size, for nobody in particular', () => {
    expect(itemsOptionsOf({}, null)).toEqual({ limit: DEFAULT_LIMIT, offset: 0 });
  });

  it('passes on what was asked, as the library service reads it', () => {
    expect(
      itemsOptionsOf(
        {
          search: 'arrival',
          kind: 'films',
          genre: 'Drama',
          yearFrom: 2010,
          yearTo: 2019,
          minRating: 7.5,
          order: 'rated',
          minYourStars: 4,
          versions: 'all',
          limit: 20,
          offset: 40,
        },
        'profile-1',
      ),
    ).toEqual({
      search: 'arrival',
      kind: 'films',
      genre: 'Drama',
      yearFrom: 2010,
      yearTo: 2019,
      minRating: 7.5,
      order: 'rated',
      profileId: 'profile-1',
      minYourStars: 4,
      withVersions: true,
      limit: 20,
      offset: 40,
    });
  });

  it('splits the lists asked for, leaving out empty entries and decades that are not numbers', () => {
    expect(
      itemsOptionsOf({ ids: 'a,,b', genres: 'Drama,Comedy', decades: '1990,x,2000' }, null),
    ).toMatchObject({ ids: ['a', 'b'], genres: ['Drama', 'Comedy'], decades: [1990, 2000] });
  });

  it('asks for the sound only where any of it was asked for, keeping only whole channel counts', () => {
    expect(itemsOptionsOf({}, null)).not.toHaveProperty('audio');
    expect(
      itemsOptionsOf({ audioLanguages: 'en', audioChannels: '6,0,two,2' }, null).audio,
    ).toEqual({ languages: ['en'], codecs: [], channels: [6, 2] });
  });
});

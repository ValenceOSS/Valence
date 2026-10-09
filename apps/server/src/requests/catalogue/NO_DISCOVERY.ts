import type { Discovery } from '@ValenceServer/requests/catalogue/Discovery';

const NOTHING_FOUND = () => Promise.resolve(new Map<string, string>());

const NO_DISCOVERY: Discovery = {
  browse: () => Promise.resolve({ matches: [], hasMore: false }),
  studios: () => Promise.resolve([]),
  genres: () => Promise.resolve([]),
  bookShelves: () => Promise.resolve([]),
  searchBooks: () => Promise.resolve([]),
  describeBook: () => Promise.resolve(null),
  charts: () => Promise.resolve({ albums: [], artists: [] }),
  describeTitle: () => Promise.resolve(null),
  describeMusic: () => Promise.resolve(null),
  findOnMusicBrainz: () => Promise.resolve(null),
  lookup: {
    films: NOTHING_FOUND,
    series: NOTHING_FOUND,
    episodesHeld: () => Promise.resolve(new Map()),
    seriesFiles: () => Promise.resolve([]),
    heldTitles: () => Promise.resolve([]),
    titleFiles: () => Promise.resolve({ folder: null, files: [] }),
    artists: NOTHING_FOUND,
    albums: NOTHING_FOUND,
    albumQualities: () => Promise.resolve(new Map()),
    artistsNamed: NOTHING_FOUND,
    albumsNamed: NOTHING_FOUND,
    booksNamed: NOTHING_FOUND,
    elsewhere: () => Promise.resolve(new Map()),
  },
};

export { NO_DISCOVERY };

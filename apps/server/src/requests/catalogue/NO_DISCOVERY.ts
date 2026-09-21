import type { Discovery } from '@ValenceServer/requests/catalogue/Discovery';

const NOTHING_FOUND = () => Promise.resolve(new Map<string, string>());

const NO_DISCOVERY: Discovery = {
  browse: () => Promise.resolve({ matches: [], hasMore: false }),
  studios: () => Promise.resolve([]),
  genres: () => Promise.resolve([]),
  charts: () => Promise.resolve({ albums: [], artists: [] }),
  describeTitle: () => Promise.resolve(null),
  describeMusic: () => Promise.resolve(null),
  findOnMusicBrainz: () => Promise.resolve(null),
  lookup: {
    films: NOTHING_FOUND,
    series: NOTHING_FOUND,
    artists: NOTHING_FOUND,
    albums: NOTHING_FOUND,
    artistsNamed: NOTHING_FOUND,
    albumsNamed: NOTHING_FOUND,
  },
};

export { NO_DISCOVERY };

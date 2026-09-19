import { DEEZER_ID_PREFIX } from '@ValenceServer/requests/catalogue/DEEZER_ID_PREFIX';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';
import type {
  CatalogueBrowsing,
  CatalogueMatch,
  CataloguePaged,
} from '@ValenceServer/library/MetadataProvider';
import type { DeezerCharts } from '@ValenceServer/requests/deezer/readDeezerCharts';
import type {
  CatalogueBrowse,
  CatalogueList,
  CatalogueStudio,
} from '@ValenceContracts/schemas/CatalogueTitle';

type UnstoodShelf = {
  id: string;
  title: string;
  titles: UnstoodTitle[];
  browse: CatalogueBrowse | null;
};

type ShelfSources = {
  browse: (browsing: CatalogueBrowsing) => Promise<CataloguePaged>;
  studios: () => Promise<CatalogueStudio[]>;
  charts: () => Promise<DeezerCharts>;
};

const VIDEO_SHELVES: readonly {
  id: string;
  title: string;
  list: CatalogueList;
  kind: 'tv' | 'movie';
}[] = [
  { id: 'trending-films', title: 'Trending films', list: 'trending', kind: 'movie' },
  { id: 'trending-series', title: 'Trending series', list: 'trending', kind: 'tv' },
  { id: 'popular-films', title: 'Popular films', list: 'popular', kind: 'movie' },
  { id: 'popular-series', title: 'Popular series', list: 'popular', kind: 'tv' },
  { id: 'coming-films', title: 'Coming soon', list: 'upcoming', kind: 'movie' },
  { id: 'airing-series', title: 'On the air', list: 'upcoming', kind: 'tv' },
];

/**
 * A film or series the catalogue listed, as a title to ask for.
 *
 * @param match - What the catalogue listed.
 * @returns It as a title.
 */
const titleOf = (match: CatalogueMatch): UnstoodTitle => ({
  kind: match.kind === 'movie' ? 'film' : 'series',
  id: match.externalId,
  title: match.title,
  subtitle: null,
  year: match.year,
  overview: match.overview,
  posterUrl: match.posterUrl,
});

/**
 * The shelves of things to ask for: films and series trending, popular and coming from the
 * catalogue for somebody who may ask for them, and the albums and artists most listened to for
 * somebody who may ask for music. A shelf with nothing on it is left out.
 *
 * @param sources - Where each shelf is read from.
 * @param may - What the viewer may ask for.
 * @returns The shelves, in the order they are shown, and the studios to browse by.
 */
const discoverShelves = async (
  sources: ShelfSources,
  may: { video: boolean; music: boolean },
): Promise<{ shelves: UnstoodShelf[]; studios: CatalogueStudio[] }> => {
  const [video, studios, charts] = await Promise.all([
    may.video
      ? Promise.all(
          VIDEO_SHELVES.map(async (shelf) => ({
            id: shelf.id,
            title: shelf.title,
            titles: (
              await sources.browse({ list: shelf.list, kind: shelf.kind, page: 1, studio: null })
            ).matches.map(titleOf),
            browse: {
              kind: shelf.kind === 'movie' ? ('film' as const) : ('series' as const),
              list: shelf.list,
              studio: null,
            },
          })),
        )
      : Promise.resolve([]),
    may.video ? sources.studios() : Promise.resolve([]),
    may.music ? sources.charts() : Promise.resolve({ albums: [], artists: [] }),
  ]);

  const shelves = [
    ...video,
    {
      id: 'popular-albums',
      title: 'Popular albums',
      browse: null,
      titles: charts.albums.map((album) => ({
        kind: 'album' as const,
        id: `${DEEZER_ID_PREFIX}${album.deezerId.toString()}`,
        title: album.title,
        subtitle: album.artist,
        year: null,
        overview: null,
        posterUrl: album.coverUrl,
      })),
    },
    {
      id: 'popular-artists',
      title: 'Popular artists',
      browse: null,
      titles: charts.artists.map((artist) => ({
        kind: 'artist' as const,
        id: `${DEEZER_ID_PREFIX}${artist.deezerId.toString()}`,
        title: artist.name,
        subtitle: null,
        year: null,
        overview: null,
        posterUrl: artist.pictureUrl,
      })),
    },
  ].filter((shelf) => shelf.titles.length > 0);

  return { shelves, studios };
};

export type { ShelfSources, UnstoodShelf };

export { discoverShelves };

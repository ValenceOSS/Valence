import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import { DEEZER_ID_PREFIX } from '@ValenceServer/requests/catalogue/DEEZER_ID_PREFIX';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';
import type {
  CatalogueBrowsing,
  CatalogueMatch,
  CataloguePaged,
} from '@ValenceServer/library/MetadataProvider';
import type { OpenLibraryBook } from '@ValenceServer/requests/openLibrary/OpenLibraryBook';
import type { OpenLibraryShelf } from '@ValenceServer/requests/openLibrary/readOpenLibraryShelves';
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
  bookShelves: () => Promise<OpenLibraryShelf[]>;
};

const VIDEO_SHELVES: readonly {
  id: string;
  titleKey: StringKey;
  list: CatalogueList;
  kind: 'tv' | 'movie';
}[] = [
  {
    id: 'trending-films',
    titleKey: 'server.shelves.trendingFilms',
    list: 'trending',
    kind: 'movie',
  },
  {
    id: 'trending-series',
    titleKey: 'server.shelves.trendingSeries',
    list: 'trending',
    kind: 'tv',
  },
  { id: 'popular-films', titleKey: 'server.shelves.popularFilms', list: 'popular', kind: 'movie' },
  { id: 'popular-series', titleKey: 'server.shelves.popularSeries', list: 'popular', kind: 'tv' },
  { id: 'coming-films', titleKey: 'server.shelves.comingSoon', list: 'upcoming', kind: 'movie' },
  { id: 'airing-series', titleKey: 'server.shelves.onTheAir', list: 'upcoming', kind: 'tv' },
];

/**
 * A book Open Library listed, as a title to ask for. It goes by its Open Library number, and says
 * who wrote it where a title says who made it.
 *
 * @param book - What Open Library listed.
 * @returns It as a title.
 */
const bookAsTitle = (book: OpenLibraryBook): UnstoodTitle => ({
  kind: 'book',
  id: book.openLibraryId.toString(),
  title: book.title,
  subtitle: book.author,
  year: book.year,
  overview: null,
  posterUrl: book.coverUrl,
});

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
 * somebody who may ask for music, and what is being read and the best known of a few subjects for
 * somebody who may ask for books. A shelf with nothing on it is left out.
 *
 * @param sources - Where each shelf is read from.
 * @param may - What the viewer may ask for.
 * @returns The shelves, in the order they are shown, and the studios to browse by.
 */
const discoverShelves = async (
  sources: ShelfSources,
  may: { video: boolean; music: boolean; books: boolean },
): Promise<{ shelves: UnstoodShelf[]; studios: CatalogueStudio[] }> => {
  const [video, studios, charts, bookShelves] = await Promise.all([
    may.video
      ? Promise.all(
          VIDEO_SHELVES.map(async (shelf) => ({
            id: shelf.id,
            title: say(shelf.titleKey),
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
    may.books ? sources.bookShelves() : Promise.resolve([]),
  ]);

  const shelves = [
    ...video,
    {
      id: 'popular-albums',
      title: say('server.shelves.popularAlbums'),
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
      title: say('server.shelves.popularArtists'),
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
    ...bookShelves.map((shelf) => ({
      id: shelf.id,
      title: shelf.title,
      browse: null,
      titles: shelf.books.map(bookAsTitle),
    })),
  ].filter((shelf) => shelf.titles.length > 0);

  return { shelves, studios };
};

export type { ShelfSources, UnstoodShelf };

export { bookAsTitle, discoverShelves };

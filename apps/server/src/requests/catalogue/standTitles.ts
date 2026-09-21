import { nameKey } from '@ValenceServer/music/nameKey';
import { DEEZER_ID_PREFIX } from '@ValenceServer/requests/catalogue/DEEZER_ID_PREFIX';
import type { CatalogueStanding, CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';

const ASKABLE: CatalogueStanding = {
  status: 'askable',
  mediaId: null,
  requestId: null,
  requestState: null,
};

/**
 * The key an album is known by when all that is known of it is its name: its artist and title
 * together.
 *
 * @param title - The album's title.
 * @param artist - Who it is by.
 * @returns The key.
 */
const albumKey = (title: string, artist: string | null): string =>
  `${nameKey(artist ?? '')}/${nameKey(title)}`;

/**
 * The key a book is known by when all that is known of it is its name: its author and title
 * together.
 *
 * @param title - The book's title.
 * @param author - Who wrote it.
 * @returns The key.
 */
const bookKey = (title: string, author: string | null): string =>
  `${nameKey(author ?? '')}/${nameKey(title)}`;

/**
 * Whether a request is for a title: a film or series by its TMDB id, a book by its Open Library id,
 * an artist or album by its MusicBrainz id — or, for one known only from Deezer's charts, by its
 * name.
 *
 * @param request - The request.
 * @param title - The title.
 * @returns Whether the request is for it.
 */
const isFor = (request: MediaRequest, title: UnstoodTitle): boolean => {
  if (request.kind !== title.kind) {
    return false;
  }

  if (title.kind === 'film' || title.kind === 'series') {
    return request.tmdbId?.toString() === title.id;
  }

  if (title.kind === 'book') {
    return request.openLibraryId?.toString() === title.id;
  }

  if (!title.id.startsWith(DEEZER_ID_PREFIX)) {
    return request.musicBrainzId === title.id;
  }

  return title.kind === 'artist'
    ? nameKey(request.title) === nameKey(title.title)
    : albumKey(request.title, request.artistName) === albumKey(title.title, title.subtitle);
};

/**
 * Says where each title stands for whoever is looking: in the library already, with where it is;
 * asked for, with where the request has got to; or there to be asked for. A title known only from
 * Deezer's charts is found by its name, having no MusicBrainz id to be found by.
 *
 * @param titles - The titles.
 * @param lookup - The library, looked into.
 * @param requests - Every request.
 * @returns The titles, each with where it stands.
 */
const standTitles = async (
  titles: readonly UnstoodTitle[],
  lookup: CatalogueLookup,
  requests: readonly MediaRequest[],
): Promise<CatalogueTitle[]> => {
  const idsOf = (kind: UnstoodTitle['kind'], isNamed: boolean) =>
    titles
      .filter((title) => title.kind === kind && title.id.startsWith(DEEZER_ID_PREFIX) === isNamed)
      .map((title) => title.id);
  const namedOf = (kind: UnstoodTitle['kind']) =>
    titles.filter((title) => title.kind === kind && title.id.startsWith(DEEZER_ID_PREFIX));
  const [films, series, artists, albums, artistsNamed, albumsNamed, books] = await Promise.all([
    lookup.films(idsOf('film', false)),
    lookup.series(idsOf('series', false)),
    lookup.artists(idsOf('artist', false)),
    lookup.albums(idsOf('album', false)),
    lookup.artistsNamed(namedOf('artist').map((title) => nameKey(title.title))),
    lookup.albumsNamed(namedOf('album').map((title) => albumKey(title.title, title.subtitle))),
    lookup.booksNamed(
      titles
        .filter((title) => title.kind === 'book')
        .map((title) => ({ key: bookKey(title.title, title.subtitle), title: title.title })),
    ),
  ]);

  const inLibrary = (title: UnstoodTitle): string | undefined => {
    const isNamed = title.id.startsWith(DEEZER_ID_PREFIX);

    switch (title.kind) {
      case 'book':
        return books.get(bookKey(title.title, title.subtitle));
      case 'film':
        return films.get(title.id);
      case 'series':
        return series.get(title.id);
      case 'artist':
        return isNamed ? artistsNamed.get(nameKey(title.title)) : artists.get(title.id);
      case 'album':
        return isNamed
          ? albumsNamed.get(albumKey(title.title, title.subtitle))
          : albums.get(title.id);
    }
  };

  return titles.map((title) => {
    const mediaId = inLibrary(title);
    const request = requests.find((one) => isFor(one, title));

    if (mediaId !== undefined) {
      return {
        ...title,
        standing: {
          status: 'library',
          mediaId,
          requestId: request?.id ?? null,
          requestState: request?.state ?? null,
        },
      };
    }

    return {
      ...title,
      standing:
        request === undefined
          ? ASKABLE
          : {
              status: 'requested',
              mediaId: request.mediaId,
              requestId: request.id,
              requestState: request.state,
            },
    };
  });
};

export { standTitles };

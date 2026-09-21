import { DEEZER_ID_PREFIX } from '@ValenceServer/requests/catalogue/DEEZER_ID_PREFIX';
import type { CatalogueTitleDetail } from '@ValenceContracts/schemas/CatalogueTitle';
import type {
  MediaRequestKind,
  MusicRequestKind,
  RequestCatalogue,
} from '@ValenceContracts/schemas/MediaRequest';
import type { OpenLibraryDescription } from '@ValenceServer/requests/openLibrary/describeOpenLibraryBook';
import type { CatalogueDescription } from '@ValenceServer/library/MetadataProvider';

type UnstoodDetail = Omit<CatalogueTitleDetail, 'standing'>;

type DescriptionSources = {
  describeTitle: (tmdbId: string, kind: 'tv' | 'movie') => Promise<CatalogueDescription | null>;
  describeMusic: (
    musicBrainzId: string,
    kind: MusicRequestKind,
  ) => Promise<RequestCatalogue | null>;
  findOnMusicBrainz: (kind: MusicRequestKind, deezerId: number) => Promise<string | null>;
  describeBook: (openLibraryId: number) => Promise<OpenLibraryDescription | null>;
};

/**
 * The MusicBrainz id a music title goes by: its own, or — for one known only from Deezer's charts
 * — the one MusicBrainz is sure it is.
 *
 * @param sources - Where to look.
 * @param kind - Whether it is an artist or an album.
 * @param id - The id it was listed under.
 * @returns The MusicBrainz id, or null where it could not be found.
 */
const musicBrainzIdOf = async (
  sources: DescriptionSources,
  kind: MusicRequestKind,
  id: string,
): Promise<string | null> => {
  if (!id.startsWith(DEEZER_ID_PREFIX)) {
    return id;
  }

  const deezerId = Number(id.slice(DEEZER_ID_PREFIX.length));

  return Number.isInteger(deezerId) && deezerId > 0
    ? sources.findOnMusicBrainz(kind, deezerId)
    : null;
};

/**
 * Everything a title's page shows of something not asked for yet: a film or series with its
 * backdrop, genres, running time, cast and trailer from the catalogue, a book with its authors and
 * subjects from Open Library, or an artist with their albums and an album with its artist from
 * MusicBrainz. A title from Deezer's charts is found in MusicBrainz
 * first, so it can be asked for by the id a request needs.
 *
 * @param sources - Where each kind is described.
 * @param kind - What kind of title it is.
 * @param id - The id it was listed under.
 * @returns What its page shows, or null where it could not be found.
 */
const describeCatalogueTitle = async (
  sources: DescriptionSources,
  kind: MediaRequestKind,
  id: string,
): Promise<UnstoodDetail | null> => {
  if (kind === 'film' || kind === 'series') {
    const found = await sources.describeTitle(id, kind === 'film' ? 'movie' : 'tv');

    return found === null
      ? null
      : {
          kind,
          id,
          musicBrainzId: null,
          title: found.title,
          subtitle: null,
          year: found.year,
          overview: found.overview,
          posterUrl: found.posterUrl,
          backdropUrl: found.backdropUrl,
          genres: found.genres,
          runtimeMinutes: found.runtimeMinutes,
          cast: found.cast,
          albums: [],
          authors: [],
          trailerKey: found.trailerKey,
        };
  }

  if (kind === 'book') {
    const openLibraryId = Number(id);
    const found =
      Number.isInteger(openLibraryId) && openLibraryId > 0
        ? await sources.describeBook(openLibraryId)
        : null;

    return found === null
      ? null
      : {
          kind,
          id,
          musicBrainzId: null,
          title: found.title,
          subtitle: found.authors[0] ?? null,
          year: found.year,
          overview: found.overview,
          posterUrl: found.posterUrl,
          backdropUrl: null,
          genres: found.subjects,
          runtimeMinutes: null,
          cast: [],
          albums: [],
          authors: found.authors,
          trailerKey: null,
        };
  }

  const musicBrainzId = await musicBrainzIdOf(sources, kind, id);
  const found = musicBrainzId === null ? null : await sources.describeMusic(musicBrainzId, kind);

  return musicBrainzId === null || found === null
    ? null
    : {
        kind,
        id: musicBrainzId,
        musicBrainzId,
        title: found.title,
        subtitle: kind === 'album' ? found.artist : null,
        year: found.year,
        overview: found.overview,
        posterUrl: found.posterUrl,
        backdropUrl: null,
        genres: [],
        runtimeMinutes: null,
        cast: [],
        albums: kind === 'artist' ? found.albums : [],
        authors: [],
        trailerKey: null,
      };
};

export type { DescriptionSources, UnstoodDetail };

export { describeCatalogueTitle };

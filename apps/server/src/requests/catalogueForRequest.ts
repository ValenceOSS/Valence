import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import type { CourOrder } from '@ValenceContracts/schemas/Anime';
import type {
  MediaRequestKind,
  MusicRequestKind,
  RequestCatalogue,
  VideoRequestKind,
} from '@ValenceContracts/schemas/MediaRequest';

type CatalogueSources = {
  describeForRequest: (
    tmdbId: number,
    kind: VideoRequestKind,
    courOrder?: CourOrder,
    asAnime?: boolean,
  ) => Promise<RequestCatalogue | null>;
  describeMusicForRequest: (
    musicBrainzId: string,
    kind: MusicRequestKind,
  ) => Promise<RequestCatalogue | null>;
  describeBookForRequest: (openLibraryId: number) => Promise<RequestCatalogue | null>;
  describeBookSeriesForRequest?: (seriesAsin: string) => Promise<RequestCatalogue | null>;
};

/**
 * What the catalogue says of something asked for: TMDB of a film or a series, by its TMDB id,
 * MusicBrainz of an artist or an album, by its MusicBrainz id, Open Library of a book, by its Open
 * Library id, and Audible of a book series, by its Audible id. Anime's cours are worked out the way
 * the request asks, and a series is taken for anime where it is filed among the anime.
 *
 * @param sources - How each catalogue is asked.
 * @param asked - What was asked for, and the id its kind is found by.
 * @returns What the catalogue says, or null where it lacks the id, does not know it, or cannot be
 *   asked.
 */
const catalogueForRequest = (
  sources: CatalogueSources,
  asked: {
    kind: MediaRequestKind;
    tmdbId?: number | null | undefined;
    musicBrainzId?: string | null | undefined;
    openLibraryId?: number | null | undefined;
    seriesAsin?: string | null | undefined;
    courOrder?: CourOrder | null | undefined;
    asAnime?: boolean;
  },
): Promise<RequestCatalogue | null> => {
  if (asked.kind === 'bookSeries') {
    return asked.seriesAsin === undefined ||
      asked.seriesAsin === null ||
      sources.describeBookSeriesForRequest === undefined
      ? Promise.resolve(null)
      : sources.describeBookSeriesForRequest(asked.seriesAsin);
  }

  if (isBookRequest(asked.kind)) {
    return asked.openLibraryId === undefined || asked.openLibraryId === null
      ? Promise.resolve(null)
      : sources.describeBookForRequest(asked.openLibraryId);
  }

  if (isMusicRequest(asked.kind)) {
    return asked.musicBrainzId === undefined || asked.musicBrainzId === null
      ? Promise.resolve(null)
      : sources.describeMusicForRequest(asked.musicBrainzId, asked.kind);
  }

  return asked.tmdbId === undefined || asked.tmdbId === null
    ? Promise.resolve(null)
    : sources.describeForRequest(
        asked.tmdbId,
        asked.kind,
        asked.courOrder ?? undefined,
        asked.asAnime ?? false,
      );
};

export type { CatalogueSources };

export { catalogueForRequest };

import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The id a request's title has in the catalogue its kind comes from, as its page is opened by: a
 * book's Open Library number, a book series' Audible id, an artist's or album's MusicBrainz id, or a film's or series' TMDB id.
 *
 * @param request - The request.
 * @returns The id, or an empty one where the request has none.
 */
const catalogueIdOfRequest = (
  request: Pick<MediaRequest, 'kind' | 'tmdbId' | 'musicBrainzId' | 'openLibraryId' | 'seriesAsin'>,
): string => {
  switch (request.kind) {
    case 'book':
      return request.openLibraryId?.toString() ?? '';
    case 'bookSeries':
      return request.seriesAsin ?? '';
    case 'artist':
    case 'album':
      return request.musicBrainzId ?? '';
    case 'film':
    case 'series':
      return request.tmdbId?.toString() ?? '';
  }
};

export { catalogueIdOfRequest };

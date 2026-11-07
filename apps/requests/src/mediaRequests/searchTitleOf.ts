import { volumeOf } from '@ValenceRequests/mediaRequests/volumeOf';
import { queryTitleOf } from '@ValenceRequests/mediaRequests/queryTitleOf';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The title a request is searched for by, made safe to search with — and for a film, followed by
 * the year it came out, since public sites match on words rather than catalogue ids, and a title
 * shared with a franchise or an older film otherwise fills their first page with everything else of
 * that name. A volume of a series — a manga — is searched for by the series' name alone, since a
 * series is shared as runs of its volumes, which a search for one volume's title does not find.
 *
 * @param request - What was asked for.
 * @returns The title to search by.
 */
const searchTitleOf = (request: Pick<MediaRequestRecord, 'kind' | 'title' | 'year'>): string => {
  const volume = request.kind === 'book' ? volumeOf(request.title) : null;
  const title = queryTitleOf(volume === null ? request.title : volume.series);

  return request.kind !== 'film' || request.year === null || title.endsWith(request.year.toString())
    ? title
    : `${title} ${request.year.toString()}`;
};

export { searchTitleOf };

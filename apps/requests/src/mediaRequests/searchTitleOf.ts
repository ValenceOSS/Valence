import { queryTitleOf } from '@ValenceRequests/mediaRequests/queryTitleOf';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The title a request is searched for by, made safe to search with — and for a film, followed by
 * the year it came out, since public sites match on words rather than catalogue ids, and a title
 * shared with a franchise or an older film otherwise fills their first page with everything else of
 * that name.
 *
 * @param request - What was asked for.
 * @returns The title to search by.
 */
const searchTitleOf = (request: Pick<MediaRequestRecord, 'kind' | 'title' | 'year'>): string => {
  const title = queryTitleOf(request.title);

  return request.kind !== 'film' || request.year === null || title.endsWith(request.year.toString())
    ? title
    : `${title} ${request.year.toString()}`;
};

export { searchTitleOf };

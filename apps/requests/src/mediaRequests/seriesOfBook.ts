import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The series a book was asked for as part of, by the name Audible gives it; nothing for a book
 * asked for on its own, which a pack of its series is never fetched for.
 *
 * @param request - The book, with its narrations, which say its series.
 * @returns The series' name, or null.
 */
const seriesOfBook = (
  request: Pick<MediaRequestRecord, 'narrations' | 'seriesRequestId'>,
): string | null =>
  (request.seriesRequestId ?? null) === null
    ? null
    : ((request.narrations ?? []).find((narration) => narration.series !== null)?.series ?? null);

export { seriesOfBook };

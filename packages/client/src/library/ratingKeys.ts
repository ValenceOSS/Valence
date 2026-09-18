import type { RatingSubject } from '@ValenceClient/library/fetchRatings';

/**
 * Builds the key a rating is held under, keeping items, programmes and books apart so that two of
 * them sharing an identifier never answer for each other.
 *
 * @param subject - The item or programme.
 * @returns The key it is held under.
 */
const keyFor = (subject: RatingSubject): string =>
  'mediaId' in subject
    ? `media:${subject.mediaId}`
    : 'seriesId' in subject
      ? `series:${subject.seriesId}`
      : `book:${subject.bookId}`;

/**
 * Says which subject a rating the server sent back is about, which is the same key read the other
 * way round.
 *
 * @param rating - What the server sent.
 * @returns The key it is held under.
 */
const keyOf = (rating: {
  mediaId: string | null;
  seriesId: string | null;
  bookId: string | null;
}): string =>
  rating.mediaId !== null
    ? `media:${rating.mediaId}`
    : rating.seriesId !== null
      ? `series:${rating.seriesId}`
      : `book:${rating.bookId ?? ''}`;

export { keyFor, keyOf };

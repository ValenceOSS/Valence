import { readFromServer } from '@ValenceClient/query/readFromServer';
import { HouseholdRatingSchema, RatingListSchema } from '@ValenceContracts/schemas/Rating';
import type { HouseholdRating, Rating } from '@ValenceContracts/schemas/Rating';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';

type RatingSubject = { mediaId: string } | { seriesId: string } | { bookId: string };

/**
 * Builds the address a subject's rating is reached at, so an item, a programme and a book are asked
 * about in the same way at different paths rather than through near-identical functions.
 *
 * @param subject - The item, programme or book.
 * @returns Where its rating lives.
 */
const addressOf = (subject: RatingSubject): string =>
  'mediaId' in subject
    ? `/api/media/${subject.mediaId}`
    : 'seriesId' in subject
      ? `/api/series/${subject.seriesId}`
      : `/api/books/${subject.bookId}`;

/**
 * Everything this viewer has rated, items and programmes alike. Per profile rather than per account,
 * since two people in a household disagreeing about a film is the point of recording it at all.
 *
 * @returns What they have rated, or none where the request failed.
 */
const fetchRatings = async (): Promise<Rating[]> => {
  return (await readFromServer('/api/ratings', RatingListSchema, profileHeaders())).ratings;
};

/**
 * Records what this viewer thinks of something, or takes it back where no rating is given. One call
 * for both, since the row of stars in the interface already knows which of the two it means.
 *
 * @param subject - The item or programme being rated.
 * @param stars - What they gave it, or null to take the rating back.
 * @returns Whether the server accepted it.
 */
const setRating = async (subject: RatingSubject, stars: number | null): Promise<boolean> => {
  const response = await fetch(`${addressOf(subject)}/rating`, {
    method: stars === null ? 'DELETE' : 'PUT',
    credentials: 'same-origin',
    headers:
      stars === null
        ? profileHeaders()
        : { 'content-type': 'application/json', ...profileHeaders() },
    ...(stars === null ? {} : { body: JSON.stringify({ stars }) }),
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Reads what the whole household gave something, which is the figure shown beside the catalogue's.
 * Answers with nothing rather than zero where nobody has rated it or the request failed — no opinion
 * and a bad opinion are different answers.
 *
 * @param subject - The item or programme being asked about.
 * @returns The average and how many gave it.
 */
const fetchHouseholdRating = async (subject: RatingSubject): Promise<HouseholdRating> => {
  return readFromServer(`${addressOf(subject)}/rating/household`, HouseholdRatingSchema);
};

export type { RatingSubject };

export { fetchRatings, setRating, fetchHouseholdRating };

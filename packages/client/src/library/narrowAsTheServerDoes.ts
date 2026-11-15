import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type NarrowedHere = {
  genres?: readonly string[];
  decades?: readonly number[];
  minRating?: number;
};

const DECADE = 10;

/**
 * Keeps what survives the filters a list of titles can be narrowed by without asking the server
 * again, in step with how the server narrows by them: any of the genres, any of the decades, and at
 * least the rating, where something with no year or no rating fails a filter asking about one.
 *
 * @param items - Every film or episode read.
 * @param narrowed - The genres, decades and least rating asked for.
 * @returns The ones that survive, the same list where nothing was asked.
 */
const narrowAsTheServerDoes = (
  items: readonly MediaSummary[],
  { genres = [], decades = [], minRating }: NarrowedHere,
): readonly MediaSummary[] => {
  if (genres.length === 0 && decades.length === 0 && minRating === undefined) {
    return items;
  }

  return items.filter(({ genres: held, year, rating }) => {
    const isOfAGenre = genres.length === 0 || genres.some((one) => held?.includes(one) === true);
    const isOfADecade =
      decades.length === 0 ||
      (year !== null && decades.some((decade) => year >= decade && year < decade + DECADE));
    const isRatedEnough =
      minRating === undefined || (rating !== null && rating !== undefined && rating >= minRating);

    return isOfAGenre && isOfADecade && isRatedEnough;
  });
};

export type { NarrowedHere };

export { narrowAsTheServerDoes };

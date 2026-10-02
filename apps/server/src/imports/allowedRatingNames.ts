type RatingStep = {
  name: string;
  score: number | null;
  subScore: number | null;
};

/**
 * The ratings at or below a Jellyfin or Emby parental limit, read through the source's own rating
 * table, because the numbers in a limit mean different things on different versions.
 *
 * @param table - The source's ratings and their scores.
 * @param maximum - The limit's score.
 * @param maximumSub - The limit's sub-score, on versions that have one.
 * @returns The names of the ratings within the limit.
 */
const allowedRatingNames = (
  table: readonly RatingStep[],
  maximum: number,
  maximumSub: number | null,
): string[] =>
  table
    .filter(
      (step) =>
        step.score !== null &&
        (step.score < maximum ||
          (step.score === maximum &&
            (maximumSub === null || step.subScore === null || step.subScore <= maximumSub))),
    )
    .map((step) => step.name);

export type { RatingStep };

export { allowedRatingNames };

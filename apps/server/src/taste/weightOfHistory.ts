import type { TitleHistory } from './TitleHistory';

const HALF_LIFE_DAYS = 120;

const OLDEST_COUNTS_FOR = 0.25;

const FINISHED_FROM = 0.7;

const GAVE_UP_UNDER = 0.2;

const GAVE_UP_AFTER_DAYS = 14;

const MIDDLE_STARS = 2.5;

const STARS_WEIGH = 1.5;

const FAVOURITE_WEIGHS = 1;

const MOST_FROM_A_SERIES = 1.5;

/**
 * How much one title says about somebody's taste: how much of it they watched and how lately, a
 * film left early and long ago counting against it, a programme counting more the more episodes
 * they got through; their stars, below the middle counting against it; and whether they kept it.
 *
 * @param history - What they did with the title.
 * @returns The weight, negative where it says what they do not like.
 */
const weightOfHistory = (history: TitleHistory): number => {
  const latest = Math.min(...history.viewings.map((one) => one.daysAgo), Number.POSITIVE_INFINITY);
  const fading =
    latest === Number.POSITIVE_INFINITY
      ? 1
      : Math.max(OLDEST_COUNTS_FOR, 0.5 ** (latest / HALF_LIFE_DAYS));
  const completions = history.viewings.map((one) =>
    one.isFinished ? 1 : Math.min(1, one.secondsWatched / Math.max(1, one.durationSeconds)),
  );
  let watched = 0;

  if (history.isSeries) {
    const through = completions.reduce((sum, done) => sum + done, 0);

    watched = through === 0 ? 0 : Math.min(MOST_FROM_A_SERIES, 0.4 + 0.3 * Math.log(1 + through));
  } else if (completions.length > 0) {
    const furthest = Math.max(...completions);

    watched =
      furthest >= FINISHED_FROM
        ? 1
        : furthest < GAVE_UP_UNDER && latest > GAVE_UP_AFTER_DAYS
          ? -0.3
          : furthest;
  }

  const starred =
    history.stars === null ? 0 : ((history.stars - MIDDLE_STARS) / MIDDLE_STARS) * STARS_WEIGH;

  return watched * fading + starred + (history.isFavourite ? FAVOURITE_WEIGHS : 0);
};

export { weightOfHistory };

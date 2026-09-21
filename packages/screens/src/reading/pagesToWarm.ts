const AHEAD_TO_BEHIND = 2;

/**
 * Chooses which pages to have ready, nearest first: the ones just ahead of where somebody is, which
 * they will meet next, then the ones just behind, in a proportion of two ahead to every one behind
 * because a book is read forward far more than back. Everything within reach is included where the
 * book is short enough, and only as much as the limit allows where it is long, so a thousand-page
 * volume does not hold a thousand pictures in memory for the sake of a hundred.
 *
 * @param centre - The page somebody is on.
 * @param count - How many pages the chapter has.
 * @param limit - The most pages to have ready at once.
 * @returns The pages to fetch, in the order to fetch them.
 */
const pagesToWarm = (centre: number, count: number, limit: number): number[] => {
  const chosen: number[] = [];
  let ahead = centre + 1;
  let behind = centre - 1;

  if (centre >= 0 && centre < count) {
    chosen.push(centre);
  }

  while (chosen.length < limit && (ahead < count || behind >= 0)) {
    for (
      let step = 0;
      step < AHEAD_TO_BEHIND && ahead < count && chosen.length < limit;
      step += 1
    ) {
      chosen.push(ahead);
      ahead += 1;
    }

    if (behind >= 0 && chosen.length < limit) {
      chosen.push(behind);
      behind -= 1;
    }
  }

  return chosen;
};

export { pagesToWarm };

type RateAverage = {
  add: (rate: number | null) => void;
  take: () => number | null;
};

/**
 * Averages the rates heard since it was last taken from, so a sample kept once a minute says what the
 * whole minute moved rather than the one second it was taken in.
 *
 * @returns What to add each rate heard to, and what to take the average from, which starts it again;
 * nothing where no rate was heard.
 */
const createRateAverage = (): RateAverage => {
  let total = 0;
  let heard = 0;

  return {
    add: (rate) => {
      if (rate === null) {
        return;
      }

      total += rate;
      heard += 1;
    },
    take: () => {
      const average = heard === 0 ? null : total / heard;

      total = 0;
      heard = 0;

      return average;
    },
  };
};

export { createRateAverage };

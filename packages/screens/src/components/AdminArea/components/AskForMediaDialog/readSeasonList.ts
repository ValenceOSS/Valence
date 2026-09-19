const MOST_SEASONS = 200;

/**
 * Reads the seasons typed as a list: numbers apart by commas or spaces, and runs such as `1-3`.
 *
 * @param text - What was typed, such as `1, 3-5`.
 * @returns The seasons in order, once each, or null where something typed is not one.
 */
const readSeasonList = (text: string): number[] | null => {
  const parts = text.split(/[\s,]+/).filter((part) => part !== '');
  const seasons = new Set<number>();

  for (const part of parts) {
    const run = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(part);

    if (run === null) {
      return null;
    }

    const first = Number(run[1]);
    const last = run[2] === undefined ? first : Number(run[2]);

    if (last < first || last > MOST_SEASONS) {
      return null;
    }

    for (let season = first; season <= last; season += 1) {
      seasons.add(season);
    }
  }

  return seasons.size === 0 ? null : [...seasons].toSorted((left, right) => left - right);
};

export { readSeasonList };

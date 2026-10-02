const DAY_MS = 86_400_000;

/**
 * Dates a number of plays when a source kept only how many there were and when the last one was:
 * the last at its real date and the others spread evenly back to when the item arrived, or a day
 * apart where that is not known.
 *
 * @param count - How many plays there were.
 * @param last - When the last one was.
 * @param since - When the item arrived on the source, where it said.
 * @returns A date for each play, oldest first, the last one being the real one.
 */
const spreadPlays = (count: number, last: Date, since: Date | null): Date[] => {
  if (count <= 0) {
    return [];
  }

  const end = last.getTime();
  const start = since === null || since.getTime() >= end ? null : since.getTime();

  return Array.from({ length: count }, (_, index) => {
    const fromTheEnd = count - 1 - index;

    return new Date(
      start === null ? end - fromTheEnd * DAY_MS : end - ((end - start) * fromTheEnd) / count,
    );
  });
};

export { spreadPlays };

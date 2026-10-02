const DAY_MS = 86_400_000;

/**
 * The day a number of days after another, both as YYYY-MM-DD.
 *
 * Counted at midnight in UTC, where every day is twenty-four hours long, so a clock going forward
 * or back is never a day gained or lost.
 *
 * @param day - The day to count from.
 * @param count - How many days on, or back where negative.
 * @returns The day reached.
 */
const addDays = (day: string, count: number): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10);

export { addDays };

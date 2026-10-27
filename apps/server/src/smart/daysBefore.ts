const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The moment a number of whole days before another.
 *
 * @param now - The moment to count back from.
 * @param days - How many days.
 * @returns The earlier moment.
 */
const daysBefore = (now: Date, days: number): Date => new Date(now.getTime() - days * DAY_MS);

export { daysBefore };

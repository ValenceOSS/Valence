const MINUTE = 60_000;

const HOUR = 60 * MINUTE;

const DAY = 24 * HOUR;

/**
 * Counts something in words that read the same for one as for several.
 *
 * @param count - How many.
 * @param unit - Of what.
 * @returns The phrase.
 */
const counted = (count: number, unit: string): string =>
  `${count.toString()} ${unit}${count === 1 ? '' : 's'}`;

/**
 * Says how old something is the way a list of releases reads it — minutes for what was posted a
 * moment ago, days for most things, and months or years for what has been about a while.
 *
 * @param when - When it was posted.
 * @param nowMs - The time now.
 * @returns How old it is, or null where the moment cannot be read.
 */
const describeAge = (when: string, nowMs: number): string | null => {
  const at = Date.parse(when);

  if (Number.isNaN(at)) {
    return null;
  }

  const age = Math.max(nowMs - at, 0);

  if (age < HOUR) {
    return counted(Math.max(Math.floor(age / MINUTE), 1), 'minute');
  }

  if (age < DAY) {
    return counted(Math.floor(age / HOUR), 'hour');
  }

  if (age < 60 * DAY) {
    return counted(Math.floor(age / DAY), 'day');
  }

  if (age < 730 * DAY) {
    return counted(Math.floor(age / (30 * DAY)), 'month');
  }

  return counted(Math.floor(age / (365 * DAY)), 'year');
};

export { describeAge };

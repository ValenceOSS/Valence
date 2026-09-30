import { sayCount } from '@ValenceI18n/sayCount';

const MINUTE = 60_000;

const HOUR = 60 * MINUTE;

const DAY = 24 * HOUR;

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
    return sayCount('common.count.minutes', Math.max(Math.floor(age / MINUTE), 1));
  }

  if (age < DAY) {
    return sayCount('common.count.hours', Math.floor(age / HOUR));
  }

  if (age < 60 * DAY) {
    return sayCount('common.count.days', Math.floor(age / DAY));
  }

  if (age < 730 * DAY) {
    return sayCount('common.count.months', Math.floor(age / (30 * DAY)));
  }

  return sayCount('common.count.years', Math.floor(age / (365 * DAY)));
};

export { describeAge };

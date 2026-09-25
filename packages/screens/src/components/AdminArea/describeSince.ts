import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Says how long ago something happened in words rather than as a timestamp, since on an
 * administration page the useful question is nearly always how long it has been rather than when
 * exactly it was.
 *
 * @param at When it happened, or null if it never has.
 * @param now What to measure against.
 */
const describeSince = (at: string | null, now: number): string => {
  if (at === null) {
    return say('admin.describeSince.never');
  }

  const then = Date.parse(at);

  if (Number.isNaN(then)) {
    return say('admin.describeSince.never');
  }

  const elapsed = now - then;

  if (elapsed < MINUTE) {
    return say('admin.describeSince.justNow');
  }

  if (elapsed < HOUR) {
    return sayCount('admin.describeSince.minutesAgo', Math.floor(elapsed / MINUTE));
  }

  if (elapsed < DAY) {
    return sayCount('admin.describeSince.hoursAgo', Math.floor(elapsed / HOUR));
  }

  return sayCount('admin.describeSince.daysAgo', Math.floor(elapsed / DAY));
};

export { describeSince };

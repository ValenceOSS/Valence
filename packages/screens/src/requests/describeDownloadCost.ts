import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;

/**
 * Says how long something took, in the largest unit that still says something.
 *
 * Plain text rather than the rolling numbers a download in flight gets: nothing about a finished
 * download is going to change, and a number that animates into place suggests otherwise.
 *
 * @param seconds - How long it took.
 * @returns Such as `under a minute`, `12 min`, `3 h 4 min` or `2 days`.
 */
const howLong = (seconds: number): string => {
  if (seconds < MINUTE) {
    return say('screens.describeDownloadCost.underAMinute');
  }

  if (seconds < HOUR) {
    return say('screens.describeDownloadCost.minutes', { minutes: Math.round(seconds / MINUTE) });
  }

  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    const minutes = Math.round((seconds % HOUR) / MINUTE);

    return minutes === 0 || minutes === 60
      ? say('screens.describeDownloadCost.hours', { hours: hours + (minutes === 60 ? 1 : 0) })
      : say('screens.describeDownloadCost.hoursAndMinutes', { hours, minutes });
  }

  const days = Math.round(seconds / DAY);

  return sayCount('screens.describeDownloadCost.days', days);
};

/**
 * Says what a finished download cost: how large it was and how long it took.
 *
 * Either half on its own where only one is known, because a download whose client never said how
 * large it was still took as long as it took.
 *
 * @param bytes - How large it was, or null.
 * @param seconds - How long it took, or null.
 * @returns Such as `1.4 GB in 12 min`, or null where neither is known.
 */
const describeDownloadCost = (bytes: number | null, seconds: number | null): string | null => {
  if (bytes === null && seconds === null) {
    return null;
  }

  if (seconds === null) {
    return say('screens.describeDownloadCost.sizeOnly', { size: formatBytes(bytes ?? 0) });
  }

  return bytes === null
    ? say('screens.describeDownloadCost.timeOnly', { time: howLong(seconds) })
    : say('screens.describeDownloadCost.sizeAndTime', {
        size: formatBytes(bytes),
        time: howLong(seconds),
      });
};

export { describeDownloadCost };

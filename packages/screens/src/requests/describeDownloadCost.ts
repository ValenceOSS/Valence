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
 * @param seconds - How long it took, a minute or more.
 * @returns Such as `12 min`, `3 h 4 min` or `2 days`.
 */
const howLong = (seconds: number): string => {
  if (seconds < HOUR) {
    return sayCount('common.count.minutesShort', Math.round(seconds / MINUTE));
  }

  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    const minutes = Math.round((seconds % HOUR) / MINUTE);

    return minutes === 0 || minutes === 60
      ? sayCount('common.count.hoursShort', hours + (minutes === 60 ? 1 : 0))
      : say('screens.requests.describeDownloadCost.hoursHMinutesMin', {
          hours: hours.toString(),
          minutes: minutes.toString(),
        });
  }

  return sayCount('common.count.days', Math.round(seconds / DAY));
};

/**
 * Says what a finished download cost: how large it was and how long it took.
 *
 * Either half on its own where only one is known, because a download whose client never said how
 * large it was still took as long as it took. Under a minute is said as such rather than in seconds.
 *
 * @param bytes - How large it was, or null.
 * @param seconds - How long it took, or null.
 * @returns Such as `1.4 GB in 12 min`, or null where neither is known.
 */
const describeDownloadCost = (bytes: number | null, seconds: number | null): string | null => {
  if (seconds === null) {
    return bytes === null
      ? null
      : say('screens.requests.describeDownloadCost.sizeDownloaded', { size: formatBytes(bytes) });
  }

  if (seconds < MINUTE) {
    return bytes === null
      ? say('screens.requests.describeDownloadCost.downloadedInUnderAMinute')
      : say('screens.requests.describeDownloadCost.sizeInUnderAMinute', {
          size: formatBytes(bytes),
        });
  }

  return bytes === null
    ? say('screens.requests.describeDownloadCost.downloadedInSeconds', {
        seconds: howLong(seconds),
      })
    : say('screens.requests.describeDownloadCost.sizeInDuration', {
        size: formatBytes(bytes),
        duration: howLong(seconds),
      });
};

export { describeDownloadCost };

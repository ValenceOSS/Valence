import { formatBytes } from '@ValenceCore/functions/formatBytes';

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
    return 'under a minute';
  }

  if (seconds < HOUR) {
    return `${Math.round(seconds / MINUTE).toString()} min`;
  }

  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    const minutes = Math.round((seconds % HOUR) / MINUTE);

    return minutes === 0 || minutes === 60
      ? `${(hours + (minutes === 60 ? 1 : 0)).toString()} h`
      : `${hours.toString()} h ${minutes.toString()} min`;
  }

  const days = Math.round(seconds / DAY);

  return `${days.toString()} ${days === 1 ? 'day' : 'days'}`;
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
    return `${formatBytes(bytes ?? 0)} downloaded`;
  }

  return bytes === null
    ? `Downloaded in ${howLong(seconds)}`
    : `${formatBytes(bytes)} in ${howLong(seconds)}`;
};

export { describeDownloadCost };

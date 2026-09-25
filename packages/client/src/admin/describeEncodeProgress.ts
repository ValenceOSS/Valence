import type { Reencode } from '@ValenceContracts/schemas/Reencode';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const A_MINUTE = 60;

const AN_HOUR = 60 * A_MINUTE;

/**
 * How long is left, in the roundest words that are still true.
 *
 * @param seconds - How much longer it has to run.
 * @returns The wait, said the way somebody would say it.
 */
const roughly = (seconds: number): string => {
  if (seconds < A_MINUTE) {
    return say('client.describeEncodeProgress.underAMinute');
  }

  if (seconds < AN_HOUR) {
    const minutes = Math.round(seconds / A_MINUTE);

    return sayCount('client.describeEncodeProgress.minutes', minutes);
  }

  const hours = Math.round(seconds / AN_HOUR);

  return sayCount('client.describeEncodeProgress.hours', hours);
};

/**
 * How an encode is getting on: how much faster than watching it, and how long is left.
 *
 * Not how fast the file is growing, which is what this used to say and what a download rightly
 * says. The two sound alike and measure opposite things: a download at 8 MB/s is doing well, and an
 * encode writing 8 MB/s is writing a *small* file — which is the entire point of the exercise, so
 * the better it does the worse the figure looks. A 98 minute film came back at "6.7 MB/s" while
 * running at fifteen times real time, and read as slow.
 *
 * What somebody wants from a bar is whether to wait. Fifteen times real time says that at a glance,
 * and the time left says it exactly.
 *
 * @param reencode - The encode, as the server last reported it.
 * @param now - The time to reckon from.
 * @returns How it is getting on, or nothing while there is not enough to say.
 */
const describeEncodeProgress = (reencode: Reencode, now = Date.now()): string => {
  if (reencode.startedAt === null || reencode.progress <= 0) {
    return '';
  }

  const elapsed = (now - Date.parse(reencode.startedAt)) / 1000;

  if (!Number.isFinite(elapsed) || elapsed <= 0) {
    return '';
  }

  const speed = (reencode.progress * reencode.durationSeconds) / elapsed;
  const left = elapsed * ((1 - reencode.progress) / reencode.progress);

  return say('client.describeEncodeProgress.progress', {
    speed: speed.toFixed(1),
    left: roughly(left),
  });
};

export { describeEncodeProgress };

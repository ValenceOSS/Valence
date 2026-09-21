import { describeLogDay, describeLogTime } from './describeLogTime';

const TWO_DAYS_MS = 2 * 86_400_000;

const HOUR_MS = 3_600_000;

/**
 * Says a moment along the bottom of the log's graph: the time of day where the graph covers a day
 * or two, and the day where it covers longer, since the hour means little across a week.
 *
 * @param atMs - The moment.
 * @param spanMs - How much time the whole graph covers.
 * @returns The label.
 */
const describeLogTick = (atMs: number, spanMs: number): string => {
  if (spanMs >= TWO_DAYS_MS) {
    return describeLogDay(atMs);
  }

  const time = describeLogTime(atMs);

  return spanMs > HOUR_MS ? time.slice(0, 5) : time;
};

/**
 * Says the stretch of time one bar of the graph covers, with the day when it is not obvious.
 *
 * @param fromMs - Where the stretch begins.
 * @param untilMs - Where it ends.
 * @returns The stretch, in words.
 */
const describeLogSpan = (fromMs: number, untilMs: number): string =>
  `${describeLogDay(fromMs)}, ${describeLogTime(fromMs)} – ${describeLogTime(untilMs)}`;

export { describeLogTick, describeLogSpan };

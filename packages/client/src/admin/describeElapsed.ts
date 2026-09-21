import { splitElapsed } from './splitElapsed';

/**
 * How long something took, in the largest units that still say it plainly — "850 ms", "1.4 s",
 * "2 min 5 s", "1 h 3 min" — rather than a count of milliseconds nobody reads.
 *
 * @param ms - How long it took.
 * @returns The time, in words.
 */
const describeElapsed = (ms: number): string =>
  splitElapsed(ms)
    .map((part) => `${part.value.toString()} ${part.unit}`)
    .join(' ');

export { describeElapsed };

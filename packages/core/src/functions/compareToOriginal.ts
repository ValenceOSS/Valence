import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const FRACTIONS = [
  'core.compareToOriginal.sameSize',
  'core.compareToOriginal.half',
  'core.compareToOriginal.third',
  'core.compareToOriginal.quarter',
  'core.compareToOriginal.fifth',
  'core.compareToOriginal.sixth',
  'core.compareToOriginal.seventh',
  'core.compareToOriginal.eighth',
  'core.compareToOriginal.ninth',
  'core.compareToOriginal.tenth',
] as const satisfies readonly StringKey[];

const A_LOT_SMALLER = FRACTIONS.length;

/**
 * How a rung's size reads against the file it came from.
 *
 * A number on its own is hard to weigh. Four gigabytes is either most of a phone or nothing at all,
 * depending on what it replaced — and the comparison is the whole point of the menu, since somebody
 * opening it is choosing between these and not judging each on its own.
 *
 * It matters most for a remux, where the arithmetic is the argument: a sixty gigabyte file offered
 * at four is a fifteenth of the size, and saying so makes the case better than either figure does.
 *
 * @param bytes - What the rung would cost.
 * @param originalBytes - What the file itself costs.
 * @returns The comparison in words, or nothing where there is nothing to compare against.
 */
const compareToOriginal = (bytes: number, originalBytes: number): string | null => {
  if (bytes <= 0 || originalBytes <= 0 || bytes >= originalBytes) {
    return null;
  }

  const times = Math.round(originalBytes / bytes);

  if (times >= A_LOT_SMALLER) {
    return say('core.compareToOriginal.smallFraction', { times: times.toString() });
  }

  const fraction = FRACTIONS[times - 1];

  return fraction === undefined ? null : say(fraction);
};

export { compareToOriginal };

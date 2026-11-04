import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Writes a number of hours as a person says it: "48 min", "1 h 20 min", "12 h".
 *
 * @param hours - The hours, not necessarily whole.
 * @returns The time in words.
 */
const hoursInWords = (hours: number): string => {
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return sayCount('common.count.minutesShort', minutes);
  }

  const whole = Math.floor(minutes / 60);
  const left = minutes % 60;

  return left === 0
    ? sayCount('common.count.hoursShort', whole)
    : say('client.books.describeLength.hoursHOverMin', {
        hours: whole.toString(),
        over: left.toString(),
      });
};

export { hoursInWords };

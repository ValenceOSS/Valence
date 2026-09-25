import { say } from '@ValenceI18n/say';

const AN_HOUR = 3600;

const A_MINUTE = 60;

/**
 * How long a title runs, as somebody would say it.
 *
 * Rounded to the nearest minute, because nobody deciding whether to start a film at eleven o'clock
 * is counting seconds, and a runtime given to the second reads as a stopwatch rather than a fact
 * about a film.
 *
 * @param seconds - How long it runs.
 * @returns What to write.
 */
const howLongItRuns = (seconds: number): string => {
  const hours = Math.floor(seconds / AN_HOUR);
  const minutes = Math.round((seconds - hours * AN_HOUR) / A_MINUTE);

  return hours === 0
    ? say('phone.howLongItRuns.minutes', { minutes: minutes.toString() })
    : say('phone.howLongItRuns.hoursAndMinutes', {
        hours: hours.toString(),
        minutes: minutes.toString(),
      });
};

export { howLongItRuns };

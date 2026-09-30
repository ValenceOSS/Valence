import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;

/**
 * How long is left, broken into the few numbers worth saying: minutes under an hour, hours and
 * minutes under a day, and days beyond that, rounded the way a person would say them.
 *
 * @param seconds - How long is left.
 * @returns Each number with its unit, or nothing where it is under a minute.
 */
const partsOfTimeLeft = (seconds: number): { value: number; unit: string }[] | null => {
  if (seconds < MINUTE) {
    return null;
  }

  if (seconds < HOUR) {
    return [{ value: Math.round(seconds / MINUTE), unit: say('core.partsOfTimeLeft.minutes') }];
  }

  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    const minutes = Math.round((seconds % HOUR) / MINUTE);

    if (minutes === 0 || minutes === 60) {
      return [{ value: hours + (minutes === 60 ? 1 : 0), unit: say('core.partsOfTimeLeft.hours') }];
    }

    return [
      { value: hours, unit: say('core.partsOfTimeLeft.hours') },
      { value: minutes, unit: say('core.partsOfTimeLeft.minutes') },
    ];
  }

  const days = Math.round(seconds / DAY);

  return [{ value: days, unit: sayCount('core.partsOfTimeLeft.days', days) }];
};

export { partsOfTimeLeft };

import { formatCalendarDate } from './formatCalendarDate';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const DAY_MS = 24 * 60 * 60 * 1000;

const SAID_IN_DAYS_UNTIL = 14;

/**
 * Says when an episode aired or airs, in the words that suit how far off it is: `Airs today`,
 * `Airs in 6 days`, `Airs 12 Oct 2026` once it is further off than a fortnight, and `Aired 2 Jan
 * 2021` once it is past.
 *
 * @param airDate - The day, as `2026-09-28`.
 * @param today - Today, in the same form.
 * @returns What to say, or nothing where either is not a date.
 */
const describeAirDate = (airDate: string, today: string): string => {
  const aired = Date.parse(`${airDate}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);

  if (Number.isNaN(aired) || Number.isNaN(now)) {
    return '';
  }

  const days = Math.round((aired - now) / DAY_MS);

  if (days < 0) {
    return say('core.describeAirDate.aired', { date: formatCalendarDate(airDate) });
  }

  if (days === 0) {
    return say('core.describeAirDate.today');
  }

  if (days === 1) {
    return say('core.describeAirDate.tomorrow');
  }

  return days <= SAID_IN_DAYS_UNTIL
    ? sayCount('core.describeAirDate.inDays', days)
    : say('core.describeAirDate.on', { date: formatCalendarDate(airDate) });
};

export { describeAirDate };

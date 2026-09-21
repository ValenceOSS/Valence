import { formatCalendarDate } from './formatCalendarDate';

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
    return `Aired ${formatCalendarDate(airDate)}`;
  }

  if (days === 0) {
    return 'Airs today';
  }

  if (days === 1) {
    return 'Airs tomorrow';
  }

  return days <= SAID_IN_DAYS_UNTIL
    ? `Airs in ${days.toString()} days`
    : `Airs ${formatCalendarDate(airDate)}`;
};

export { describeAirDate };

import { addDays } from '@ValenceCore/functions/addDays';
import { say } from '@ValenceI18n/say';

/**
 * What a day is called above the things happening on it: today and tomorrow by name, and any other
 * day by its weekday and date in the viewer's own language.
 *
 * Formatted at midnight UTC, the moment the day is stored as, so the date shown is never the day
 * before for somebody west of Greenwich.
 *
 * @param day - The day, as YYYY-MM-DD.
 * @param today - Today, as YYYY-MM-DD.
 * @param locale - Whose way of writing dates, the viewer's own unless given.
 * @returns Its name.
 */
const nameTheDay = (day: string, today: string, locale?: string): string => {
  if (day === today) {
    return say('common.today');
  }

  if (day === addDays(today, 1)) {
    return say('common.tomorrow');
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(day.slice(0, 4) === today.slice(0, 4) ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));
};

export { nameTheDay };

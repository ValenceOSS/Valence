import { addDays } from '@ValenceCore/functions/addDays';
import { startOfWeek } from '@ValenceCore/functions/startOfWeek';

/**
 * What a week is called at the top of a calendar: its first and last days, written as a span in
 * the viewer's own language.
 *
 * @param day - Any day of the week.
 * @param locale - Whose way of writing dates, the viewer's own unless given.
 * @returns The span.
 */
const nameTheWeek = (day: string, locale?: string): string => {
  const first = startOfWeek(day);

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(new Date(`${first}T00:00:00Z`), new Date(`${addDays(first, 6)}T00:00:00Z`));
};

export { nameTheWeek };

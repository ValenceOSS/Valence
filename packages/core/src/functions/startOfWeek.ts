import { addDays } from '@ValenceCore/functions/addDays';

/**
 * The first day of the week a day falls in, as YYYY-MM-DD, the week starting on a Monday.
 *
 * @param day - Any day of the week.
 * @returns Its Monday.
 */
const startOfWeek = (day: string): string => {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();

  return addDays(day, -((weekday + 6) % 7));
};

export { startOfWeek };

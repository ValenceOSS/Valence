/**
 * The short name of the weekday a day falls on, for the heading of a calendar's column.
 *
 * @param day - The day, as YYYY-MM-DD.
 * @param locale - Whose language, the viewer's own unless given.
 * @returns The weekday's short name.
 */
const nameTheWeekday = (day: string, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  );

export { nameTheWeekday };

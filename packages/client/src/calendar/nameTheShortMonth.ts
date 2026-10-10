/**
 * The short name of the month a day falls in, for the strip of months over the calendar's
 * timeline.
 *
 * @param day - The day, as YYYY-MM-DD.
 * @param locale - Whose language, the viewer's own unless given.
 * @returns The month's short name.
 */
const nameTheShortMonth = (day: string, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  );

export { nameTheShortMonth };

/**
 * The short name of a day, its weekday and the date in the month, for the heading of a narrow
 * calendar column.
 *
 * @param day - The day, as YYYY-MM-DD.
 * @param locale - Whose language, the viewer's own unless given.
 * @returns The day's short name.
 */
const nameTheShortDay = (day: string, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  );

export { nameTheShortDay };

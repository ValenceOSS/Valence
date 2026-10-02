/**
 * What a month is called at the top of a calendar, in the viewer's own language.
 *
 * @param day - Any day of the month, as YYYY-MM-DD.
 * @param locale - Whose way of writing dates, the viewer's own unless given.
 * @returns Its name and year.
 */
const nameTheMonth = (day: string, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${day.slice(0, 7)}-01T00:00:00Z`),
  );

export { nameTheMonth };

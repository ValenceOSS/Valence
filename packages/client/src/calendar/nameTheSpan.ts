/**
 * The months a run of days covers, for the heading of the calendar's timeline: one month where it
 * stays inside one, and both ends where it crosses into another.
 *
 * @param span - Its first and last days, as YYYY-MM-DD.
 * @param locale - Whose language, the viewer's own unless given.
 * @returns The span's name.
 */
const nameTheSpan = ({ from, to }: { from: string; to: string }, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).formatRange(
    new Date(`${from}T00:00:00Z`),
    new Date(`${to}T00:00:00Z`),
  );

export { nameTheSpan };

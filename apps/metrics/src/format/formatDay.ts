const DAY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Writes a calendar day the way the page reads it, such as "29 Oct 2026".
 *
 * @param day - The day, as `YYYY-MM-DD`.
 * @returns The day, written out.
 */
const formatDay = (day: string): string => DAY.format(new Date(`${day}T00:00:00Z`));

export { formatDay };

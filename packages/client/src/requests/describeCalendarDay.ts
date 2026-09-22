const DAY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * A calendar date as a person reads it.
 *
 * @param date - Such as `2021-12-03`.
 * @returns Such as `3 Dec 2021`.
 */
const describeCalendarDay = (date: string): string => DAY.format(new Date(`${date}T00:00:00Z`));

export { describeCalendarDay };

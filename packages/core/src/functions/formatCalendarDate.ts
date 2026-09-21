const DAY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Says a calendar date as a person would write it: `15 Sep 2021`.
 *
 * A date with no time and no zone is read as the day it names wherever it is read, rather than as
 * midnight in some zone that could put it on the day before.
 *
 * @param date - The day, as `2021-09-15`.
 * @returns The day in words, or the text given where it is not a date.
 */
const formatCalendarDate = (date: string): string => {
  const at = new Date(`${date}T00:00:00Z`);

  return Number.isNaN(at.getTime()) ? date : DAY.format(at);
};

export { formatCalendarDate };

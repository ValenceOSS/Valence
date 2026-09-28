const SAID = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Says a release's date the way a person would write it, such as 25 September 2026.
 *
 * @param date - The date, as a calendar day.
 * @returns It in words.
 */
const describeReleaseDate = (date: string): string => SAID.format(new Date(`${date}T00:00:00Z`));

export { describeReleaseDate };

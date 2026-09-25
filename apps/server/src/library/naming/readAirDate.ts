const YEAR_FIRST = /^(?<year>\d{4})(?<separator>[._ -])(?<month>\d{2})\k<separator>(?<day>\d{2})$/;

const DAY_FIRST = /^(?<day>\d{2})(?<separator>[._ -])(?<month>\d{2})\k<separator>(?<year>\d{4})$/;

/**
 * Reads an air date written the way a daily programme's files are, `2017.04.20` or `20-04-2017`,
 * with the same separator throughout and a day the month actually has.
 *
 * @param text - What the date rule matched.
 * @returns The date, or null where it is not one.
 */
const readAirDate = (text: string): { year: number; month: number; day: number } | null => {
  const found = (YEAR_FIRST.exec(text) ?? DAY_FIRST.exec(text))?.groups;

  if (found?.year === undefined || found.month === undefined || found.day === undefined) {
    return null;
  }

  const year = Number(found.year);
  const month = Number(found.month);
  const day = Number(found.day);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? { year, month, day }
    : null;
};

export { readAirDate };

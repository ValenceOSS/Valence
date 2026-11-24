import type { Season } from '@ValenceContracts/constants/SEASONS';

const OCTOBER = 9;

const NOVEMBER = 10;

const DECEMBER = 11;

const LAST_DAY_OF_CHRISTMAS = 26;

/**
 * Names the season a day falls in by the calendar where it is: Halloween through October, and
 * Christmas from the first of November to Boxing Day.
 *
 * @param day - The day, read in local time.
 * @returns The season, or null outside every season.
 */
const seasonOn = (day: Date): Season | null => {
  const month = day.getMonth();

  if (month === OCTOBER) {
    return 'halloween';
  }

  if (month === NOVEMBER || (month === DECEMBER && day.getDate() <= LAST_DAY_OF_CHRISTMAS)) {
    return 'christmas';
  }

  return null;
};

export { seasonOn };

/**
 * Works out how old somebody is, or was when they died, counting from the day the catalogue names
 * as their birthday to the day it is, or was, where the count is read.
 *
 * @param bornOn - The date they were born, as the catalogue gives it.
 * @param until - The day to count to, in the viewer's own time.
 * @returns Their age in whole years, or null where a date could not be read.
 */
const ageOn = (bornOn: string, until: Date): number | null => {
  const born = new Date(bornOn);

  if (Number.isNaN(born.getTime()) || Number.isNaN(until.getTime())) {
    return null;
  }

  const hasHadBirthday =
    until.getMonth() > born.getUTCMonth() ||
    (until.getMonth() === born.getUTCMonth() && until.getDate() >= born.getUTCDate());

  return until.getFullYear() - born.getUTCFullYear() - (hasHadBirthday ? 0 : 1);
};

export { ageOn };

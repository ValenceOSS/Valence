import { certificationAge } from '@ValenceCore/functions/certificationAge';

/**
 * The age a rating such as `PG-13`, `TV-MA`, `15` or `gb/15` is meant for, read in the first of the
 * regions that knows it.
 *
 * @param rating - The rating as the source wrote it.
 * @param regions - The certification systems to try, in order.
 * @returns The age, or null where no region knows the rating.
 */
const ageOfRating = (rating: string, regions: readonly string[]): number | null => {
  const [prefix = '', rest = ''] = rating.includes('/') ? rating.split('/', 2) : ['', rating];
  const tried = prefix === '' ? regions : [prefix, ...regions];

  for (const region of tried) {
    const age = certificationAge(region, rest);

    if (age !== null) {
      return Math.min(Math.max(age, 0), 21);
    }
  }

  return null;
};

export { ageOfRating };

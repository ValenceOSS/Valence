import { certificationAge } from '@ValenceCore/functions/certificationAge';
import { say } from '@ValenceI18n/say';

/**
 * Says what age a content rating is for in a country, so a rating is never picked without seeing
 * who it keeps it from.
 *
 * @param region - The country's two-letter code.
 * @param rating - The rating, such as 12A.
 * @returns What it says of the age, or nothing where the age cannot be told.
 */
const describeRatingAge = (region: string, rating: string): string | null => {
  const age = certificationAge(region, rating);

  if (age === null) {
    return null;
  }

  return age === 0
    ? say('screens.adminArea.contentRatingField.forEveryone')
    : say('screens.adminArea.contentRatingField.forAgeAndOver', { age: age.toString() });
};

export { describeRatingAge };

import { refuseForTrouble } from './refuseForTrouble';
import { troubleWatch } from './troubleWatch';

/**
 * Runs a search, and where it found nothing because a site it asked was failing, says so — so a
 * person is told the site is rate limiting or unreachable rather than that nothing matched.
 *
 * Something found while one site was failing is still an answer, and is handed back as one.
 *
 * @param search - The search.
 * @returns What it found, and the refusal to answer with instead where it found nothing for that
 *   reason.
 */
const findSayingWhy = async <Found>(search: () => Promise<Found[]>) => {
  const { value: found, trouble } = await troubleWatch.during(search);

  return {
    found,
    refusal: found.length === 0 && trouble !== null ? refuseForTrouble(trouble) : null,
  };
};

export { findSayingWhy };

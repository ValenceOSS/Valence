import { isSeasonHeld } from '@ValenceClient/requests/isSeasonHeld';
import { theSeasonsTicked } from '@ValenceClient/requests/theSeasonsTicked';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Ticks or unticks every regular season at once, leaving Specials as they were.
 *
 * @param seasons - What is being asked for, null for every season.
 * @param listed - The seasons there are.
 * @param isOn - Whether every season is to be ticked.
 * @returns What is asked for now.
 */
const tickEverySeason = (
  seasons: number[] | null,
  listed: readonly CatalogueSeason[],
  isOn: boolean,
): number[] | null => {
  const hasSpecials = theSeasonsTicked(seasons, listed).includes(0);

  if (!isOn) {
    return hasSpecials ? [0] : [];
  }

  return hasSpecials
    ? [0, ...listed.filter((one) => one.season > 0 && !isSeasonHeld(one)).map((one) => one.season)]
    : null;
};

export { tickEverySeason };

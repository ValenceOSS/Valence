import { theSeasonsTicked } from '@ValenceClient/requests/theSeasonsTicked';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Ticks or unticks one season, going back to every season, null, once all of them are ticked.
 *
 * @param seasons - What is being asked for, null for every season.
 * @param listed - The seasons there are.
 * @param season - The one pressed.
 * @returns What is asked for now.
 */
const tickASeason = (
  seasons: number[] | null,
  listed: readonly CatalogueSeason[],
  season: number,
): number[] | null => {
  const ticked = theSeasonsTicked(seasons, listed);
  const next = ticked.includes(season)
    ? ticked.filter((one) => one !== season)
    : [...ticked, season];

  return next.length === listed.length ? null : next.toSorted((left, right) => left - right);
};

export { tickASeason };

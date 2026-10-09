import { isSeasonHeld } from '@ValenceClient/requests/isSeasonHeld';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Which seasons are ticked, where every season is held as null. Every season is each regular
 * season the library does not already hold whole: Specials are a choice of their own, and there is
 * nothing to ask for in a season already on the shelf.
 *
 * @param seasons - What is being asked for, null for every season.
 * @param listed - The seasons there are.
 * @returns The season numbers ticked.
 */
const theSeasonsTicked = (seasons: number[] | null, listed: readonly CatalogueSeason[]): number[] =>
  seasons ?? listed.filter((one) => one.season > 0 && !isSeasonHeld(one)).map((one) => one.season);

export { theSeasonsTicked };

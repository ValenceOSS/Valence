import { isSeasonHeld } from '@ValenceClient/requests/isSeasonHeld';
import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Which seasons are ticked, where every season is held as null so that ones yet to air come too.
 * Every season leaves out the ones the library already holds whole, since there is nothing in them
 * to ask for.
 *
 * @param seasons - What is being asked for, null for every season.
 * @param listed - The seasons there are.
 * @returns The season numbers ticked.
 */
const theSeasonsTicked = (seasons: number[] | null, listed: readonly CatalogueSeason[]): number[] =>
  seasons ?? listed.filter((one) => !isSeasonHeld(one)).map((one) => one.season);

export { theSeasonsTicked };

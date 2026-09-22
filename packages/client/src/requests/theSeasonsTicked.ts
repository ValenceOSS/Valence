import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Which seasons are ticked, where every season is held as null so that ones yet to air come too.
 *
 * @param seasons - What is being asked for, null for every season.
 * @param listed - The seasons there are.
 * @returns The season numbers ticked.
 */
const theSeasonsTicked = (seasons: number[] | null, listed: readonly CatalogueSeason[]): number[] =>
  seasons ?? listed.map((one) => one.season);

export { theSeasonsTicked };

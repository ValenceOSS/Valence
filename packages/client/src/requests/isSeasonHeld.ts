import type { CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether the library already holds every episode of a season, so there is nothing in it to ask
 * for.
 *
 * @param season - The season.
 * @returns Whether it is held.
 */
const isSeasonHeld = (season: Pick<CatalogueSeason, 'standing'>): boolean =>
  season.standing === 'library';

export { isSeasonHeld };

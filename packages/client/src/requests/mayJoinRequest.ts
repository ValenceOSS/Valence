import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Whether whoever is looking can want a title too: somebody else asked for it, they did not, and it
 * has not been declined.
 *
 * @param standing - Where the title stands.
 * @param meId - Whoever is looking, by their account.
 * @returns Whether to offer it.
 */
const mayJoinRequest = (standing: CatalogueStanding, meId: string | null | undefined): boolean =>
  standing.status === 'requested' &&
  standing.requestId !== null &&
  standing.requestState !== 'refused' &&
  (standing.askedBy ?? []).length > 0 &&
  meId !== null &&
  meId !== undefined &&
  !(standing.askedBy ?? []).some((asker) => asker.id === meId);

export { mayJoinRequest };

import { isMyAsk } from '@ValenceContracts/functions/isMyAsk';
import type { Me } from '@ValenceContracts/functions/isMyAsk';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Whether whoever is looking can want a title too: somebody else asked for it, they did not, and it
 * has not been declined.
 *
 * @param standing - Where the title stands.
 * @param me - Whoever is looking, as their account and profile.
 * @returns Whether to offer it.
 */
const mayJoinRequest = (standing: CatalogueStanding, me: Me | null): boolean =>
  standing.status === 'requested' &&
  standing.requestId !== null &&
  standing.requestState !== 'refused' &&
  (standing.askedBy ?? []).length > 0 &&
  me !== null &&
  !(standing.askedBy ?? []).some((asker) => isMyAsk(asker, me));

export { mayJoinRequest };

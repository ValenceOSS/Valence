import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { PersonCredit } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Whether a credit on somebody's timeline opens when chosen: where it is already on this server,
 * or where the server takes requests for its kind, so it can be asked for.
 *
 * @param credit - The credit.
 * @param kinds - The kinds of title the server takes requests for.
 * @returns Whether it opens.
 */
const opensFromTheTimeline = (
  credit: PersonCredit,
  kinds: ReadonlySet<MediaRequestKind>,
): boolean =>
  credit.standing.status === 'library' ||
  credit.standing.status === 'linked' ||
  kinds.has(credit.kind);

export { opensFromTheTimeline };

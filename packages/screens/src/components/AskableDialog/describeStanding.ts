import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';
import { STATUS_LOOK } from '@ValenceScreens/status/STATUS_LOOK';
import { nameTheStanding } from '@ValenceClient/requests/nameTheStanding';

/**
 * Says where a title stands, as a badge: in the library already, somewhere along being fetched, or
 * nothing at all where it is there to be asked for.
 *
 * @param standing - Where it stands.
 * @returns The badge's words and tone, or null where there is nothing to say.
 */
const describeStanding = (
  standing: CatalogueStanding,
): { label: string; tone: BadgeTone } | null => {
  const named = nameTheStanding(standing);

  return named === null ? null : { ...STATUS_LOOK[named.look], label: named.label };
};

export { describeStanding };

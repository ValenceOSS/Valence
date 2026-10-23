import { isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';

/**
 * Whether a library item's file is still where the library found it, rather than gone missing and
 * kept a while for what viewers have of it, which leaves it out of everything but the scan's own
 * reckoning.
 *
 * @returns The condition, on the item table.
 */
const isStillThere = (): SQL => isNull(mediaItem.missingSince);

export { isStillThere };

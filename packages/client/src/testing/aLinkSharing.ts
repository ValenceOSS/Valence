import { NOTHING_SHARED } from '@ValenceContracts/constants/NOTHING_SHARED';
import type { LinkSharing } from '@ValenceContracts/schemas/LinkSharing';

/**
 * What a linked server is shared, with whatever a test cares about changed: by default one library,
 * and otherwise what a server is shared before its admin chooses.
 *
 * @param change - What differs.
 * @returns The sharing.
 */
const aLinkSharing = (change: Partial<LinkSharing> = {}): LinkSharing => ({
  ...NOTHING_SHARED,
  libraryIds: ['00000000-0000-4000-8000-0000000000f1'],
  ...change,
});

export { aLinkSharing };

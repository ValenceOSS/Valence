import type { FederationActivity } from '@ValenceContracts/schemas/LinkSharing';

/**
 * One entry of this server's record of a linked server's people, as that server is sent it: a
 * subtitle search or fetch said as looking a title up, which every version of Valence reads, while
 * this server's own administrators see it for what it was.
 *
 * @param entry - The entry.
 * @returns The entry as the linked server reads it.
 */
const asALinkedServerReadsIt = (entry: FederationActivity): FederationActivity =>
  entry.action === 'subtitles' ? { ...entry, action: 'media' } : entry;

export { asALinkedServerReadsIt };

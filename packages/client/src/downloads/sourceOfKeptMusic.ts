import type { QueueSource } from '@ValenceClient/music/playQueue';
import type { KeptListening } from '@ValenceContracts/schemas/KeptListening';

/**
 * What the player says it is playing from, for music played from what this device keeps.
 *
 * @param kept - The album, playlist or liked songs kept.
 * @returns Where the queue came from.
 */
const sourceOfKeptMusic = (kept: Pick<KeptListening, 'kind' | 'id' | 'title'>): QueueSource => ({
  kind: kept.kind === 'audiobook' ? 'tracks' : kept.kind,
  id: kept.kind === 'liked' ? null : kept.id,
  name: kept.title,
});

export { sourceOfKeptMusic };

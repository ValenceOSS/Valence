import { PROTOCOL_OF_CLIENT } from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type { ReleaseProtocol } from '@ValenceContracts/schemas/Indexer';

/**
 * Which kind of release a download client takes: what its kind always takes, or for a plugin's
 * download client, what that plugin said it takes.
 *
 * @param client - The client.
 * @returns The protocol, or null for a plugin client that names no plugin.
 */
const protocolOfClient = (
  client: Pick<DownloadClient, 'kind' | 'plugin'>,
): ReleaseProtocol | null =>
  client.kind === 'plugin' ? (client.plugin?.protocol ?? null) : PROTOCOL_OF_CLIENT[client.kind];

export { protocolOfClient };

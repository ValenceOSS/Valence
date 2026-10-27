import type { ReleaseProtocol } from '@ValenceContracts/schemas/Indexer';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';

/**
 * Whether a finished download must keep its files where its client put them, as a torrent still
 * seeding must, rather than having them moved into the library. A plugin's download client
 * seeds nothing here: its files are a copy made for filing.
 *
 * @param protocol - What kind of release it was.
 * @param client - The client it went to.
 * @returns Whether to keep the files.
 */
const keepsItsFiles = (
  protocol: ReleaseProtocol,
  client: Pick<DownloadClientRecord, 'kind'>,
): boolean => protocol === 'torrent' && client.kind !== 'plugin';

export { keepsItsFiles };

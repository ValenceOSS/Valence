import { readBodyUpTo } from '@ValenceCore/network/readBodyUpTo';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { saying } from '@ValenceI18n/saying';

/**
 * Reads an answer's body, failing the indexer's request as soon as it is longer than the limit, so
 * a host that streams without end cannot fill the service's memory.
 *
 * @param response - The answer, whose body this reads.
 * @param limit - The most bytes to accept.
 * @returns The body.
 */
const readBodyOrFail = async (response: Response, limit: number): Promise<Uint8Array> => {
  if (response.body === null) {
    return new Uint8Array();
  }

  const bytes = await readBodyUpTo(response, limit);

  if (bytes === null) {
    throw new IndexerFailure(saying('requests.indexers.indexerService.theIndexerCouldNotBeAsked'));
  }

  return bytes;
};

export { readBodyOrFail };

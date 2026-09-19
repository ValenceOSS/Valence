import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { indexerEndpoint } from '@ValenceRequests/indexers/indexerEndpoint';
import { readCapabilities } from '@ValenceRequests/indexers/readCapabilities';
import { readIndexerXml } from '@ValenceRequests/indexers/readIndexerXml';
import { readReleases } from '@ValenceRequests/indexers/readReleases';
import { searchParametersFor } from '@ValenceRequests/indexers/searchParametersFor';
import type { Pacer } from '@ValenceRequests/indexers/createPacer';
import type {
  IndexerCapabilities,
  IndexerKind,
  Release,
  ReleaseSearch,
} from '@ValenceContracts/schemas/Indexer';

type IndexerConnection = {
  id: string;
  name: string;
  kind: IndexerKind;
  url: string;
  apiKey: string;
  timeoutSeconds: number;
  requestsPerMinute: number | null;
  categories: readonly number[];
  capabilities: IndexerCapabilities | null;
};

type CreateIndexerClientOptions = {
  fetch: (
    url: string,
    init: { headers: Record<string, string>; signal: AbortSignal },
  ) => Promise<Response>;
  pacer: Pacer;
};

/**
 * Asks Torznab and Newznab indexers what they can do and what they have, each in its turn and
 * within its own time, and says why in words wherever one could not answer.
 *
 * @param fetch - How to ask.
 * @param pacer - What keeps each indexer to its own limit.
 * @returns The client.
 */
const createIndexerClient = ({ fetch, pacer }: CreateIndexerClientOptions) => {
  const ask = async (indexer: IndexerConnection, parameters: Record<string, string>) => {
    await pacer.turn(indexer.id, indexer.requestsPerMinute);

    const address = indexerEndpoint(indexer.url, {
      ...parameters,
      ...(indexer.apiKey === '' ? {} : { apikey: indexer.apiKey }),
    });

    let response: Response;

    try {
      response = await fetch(address, {
        headers: { accept: 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(indexer.timeoutSeconds * 1000),
      });
    } catch (error) {
      throw new IndexerFailure(
        error instanceof Error && error.name === 'TimeoutError'
          ? `The indexer did not answer within ${indexer.timeoutSeconds.toString()} seconds`
          : 'The indexer could not be reached',
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new IndexerFailure('The indexer refused the API key');
    }

    if (response.status === 429) {
      throw new IndexerFailure('The indexer says it has been asked too often');
    }

    if (!response.ok) {
      throw new IndexerFailure(`The indexer answered ${response.status.toString()}`);
    }

    return readIndexerXml(await response.text());
  };

  return {
    capabilities: async (indexer: IndexerConnection): Promise<IndexerCapabilities> =>
      readCapabilities(await ask(indexer, { t: 'caps' })),

    search: async (indexer: IndexerConnection, search: ReleaseSearch): Promise<Release[]> =>
      readReleases(
        await ask(indexer, searchParametersFor(search, indexer.capabilities, indexer.categories)),
        indexer,
      ),
  };
};

type IndexerClient = ReturnType<typeof createIndexerClient>;

export type { IndexerClient, IndexerConnection };

export { createIndexerClient };

import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { indexerEndpoint } from '@ValenceRequests/indexers/indexerEndpoint';
import { readCapabilities } from '@ValenceRequests/indexers/readCapabilities';
import { readIndexerXml } from '@ValenceRequests/indexers/readIndexerXml';
import { readReleases } from '@ValenceRequests/indexers/readReleases';
import { searchParametersFor } from '@ValenceRequests/indexers/searchParametersFor';
import { CaptchaNeeded } from '@ValenceRequests/indexers/CaptchaNeeded';
import { capabilitiesOf } from '@ValenceRequests/cardigann/capabilitiesOf';
import { createCardigannIndexer } from '@ValenceRequests/cardigann/createCardigannIndexer';
import { siteLinkFor } from '@ValenceRequests/cardigann/siteLinkFor';
import type { Pacer } from '@ValenceRequests/indexers/createPacer';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';
import type { SiteClient } from '@ValenceRequests/cardigann/createSiteClient';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';
import type {
  IndexerCapabilities,
  IndexerKind,
  IndexerSettings,
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
  definitionId: string | null;
  settings: IndexerSettings;
  session: SiteSession | null;
};

type CreateIndexerClientOptions = {
  fetch: (
    url: string,
    init: { headers: Record<string, string>; signal: AbortSignal },
  ) => Promise<Response>;
  pacer: Pacer;
  definitions?: (id: string) => Promise<CardigannDefinition | null>;
  site?: SiteClient;
};

/**
 * Asks Torznab and Newznab indexers what they can do and what they have, each in its turn and
 * within its own time, and says why in words wherever one could not answer.
 *
 * An indexer made from a Cardigann definition is run by the engine that reads it instead, within the
 * session the connection carries — which the engine changes as it logs in, and the caller keeps.
 *
 * @param fetch - How to ask.
 * @param pacer - What keeps each indexer to its own limit.
 * @param definitions - Where to find a definition by its id.
 * @param site - How the engine reaches the sites definitions describe.
 * @returns The client.
 */
const createIndexerClient = ({ fetch, pacer, definitions, site }: CreateIndexerClientOptions) => {
  const engineFor = async (indexer: IndexerConnection) => {
    const definition =
      definitions === undefined || indexer.definitionId === null
        ? null
        : await definitions(indexer.definitionId);

    if (definition === null || site === undefined) {
      throw new IndexerFailure('The definition for this indexer is no longer in the catalogue');
    }

    indexer.session ??= { cookies: {}, userAgent: null };

    return {
      definition,
      engine: createCardigannIndexer({
        definition,
        settings: indexer.settings,
        siteLink: siteLinkFor(definition, indexer.url),
        session: indexer.session,
        client: site,
        indexer: { id: indexer.id, name: indexer.name },
        timeoutSeconds: indexer.timeoutSeconds,
      }),
    };
  };

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
    capabilities: async (indexer: IndexerConnection): Promise<IndexerCapabilities> => {
      if (indexer.kind !== 'cardigann') {
        return readCapabilities(await ask(indexer, { t: 'caps' }));
      }

      const { definition, engine } = await engineFor(indexer);
      const answer = indexer.settings['CAPTCHA'];

      if (
        definition.login?.captcha !== undefined &&
        (typeof answer !== 'string' || answer.trim() === '')
      ) {
        const captcha = await engine.captcha();

        if (captcha !== null) {
          throw new CaptchaNeeded(captcha.image);
        }
      }

      await pacer.turn(indexer.id, indexer.requestsPerMinute);
      await engine.search({ query: '' }, []);

      return capabilitiesOf(definition);
    },

    search: async (indexer: IndexerConnection, search: ReleaseSearch): Promise<Release[]> => {
      if (indexer.kind !== 'cardigann') {
        return readReleases(
          await ask(indexer, searchParametersFor(search, indexer.capabilities, indexer.categories)),
          indexer,
        );
      }

      const { engine } = await engineFor(indexer);

      await pacer.turn(indexer.id, indexer.requestsPerMinute);

      return engine.search(search, search.categories ?? indexer.categories);
    },

    download: async (indexer: IndexerConnection, url: string): Promise<ReleaseFile> => {
      if (url.startsWith('magnet:')) {
        return { kind: 'magnet', url };
      }

      if (indexer.kind === 'cardigann') {
        const { engine } = await engineFor(indexer);

        return engine.download(url);
      }

      await pacer.turn(indexer.id, indexer.requestsPerMinute);

      let response: Response;

      try {
        response = await fetch(url, {
          headers: {},
          signal: AbortSignal.timeout(indexer.timeoutSeconds * 1000),
        });
      } catch {
        throw new IndexerFailure('The indexer could not be reached');
      }

      const bytes = new Uint8Array(await response.arrayBuffer());

      if (!response.ok || bytes.length === 0) {
        throw new IndexerFailure(
          `The indexer answered the download with ${response.status.toString()}`,
        );
      }

      return { kind: indexer.kind === 'newznab' ? 'nzb' : 'torrent', bytes };
    },
  };
};

type IndexerClient = ReturnType<typeof createIndexerClient>;

export type { IndexerClient, IndexerConnection };

export { createIndexerClient };

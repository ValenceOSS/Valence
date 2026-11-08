import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { BOOK_CAPABILITIES } from '@ValenceRequests/opds/BOOK_CAPABILITIES';
import { measureLink } from '@ValenceRequests/opds/measureLink';
import { readOpdsFeed } from '@ValenceRequests/opds/readOpdsFeed';
import { readOpenSearchTemplate } from '@ValenceRequests/opds/readOpenSearchTemplate';
import { releasesOfOpds } from '@ValenceRequests/opds/releasesOfOpds';
import type { LinkFetch } from '@ValenceRequests/opds/measureLink';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';
import type { IndexerCapabilities, Release } from '@ValenceContracts/schemas/Indexer';
import { saying } from '@ValenceI18n/saying';

type Catalogue = {
  id: string;
  name: string;
  url: string;
  timeoutSeconds: number;
  requestsPerMinute: number | null;
};

const MOST_BOOK_FEEDS = 8;

const FEED = 'application/atom+xml, application/opensearchdescription+xml, application/xml;q=0.9';

/**
 * Speaks to OPDS catalogues: finds where each searches, from the OpenSearch description its feed
 * points to or the search link it gives, and remembers it; searches for books and turns what it
 * finds into releases, following the first few books it lists only by a feed of their own; and, for a release to be downloaded, reads how big it is and what it is
 * called without downloading it, for the direct download client to fetch.
 *
 * @param fetch - How to ask.
 * @param wait - Waits for the catalogue's turn, so it is asked no faster than its limit allows.
 * @returns The catalogue client.
 */
const createOpdsCatalogue = (fetch: LinkFetch, wait: (catalogue: Catalogue) => Promise<void>) => {
  const templates = new Map<string, string>();

  const read = async (catalogue: Catalogue, url: string): Promise<Response> => {
    await wait(catalogue);

    let response: Response;

    try {
      response = await fetch(url, {
        headers: { accept: FEED },
        signal: AbortSignal.timeout(catalogue.timeoutSeconds * 1000),
      });
    } catch {
      throw new IndexerFailure(
        saying('requests.indexers.indexerService.theIndexerCouldNotBeAsked'),
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new IndexerFailure(saying('requests.opds.opdsCatalogue.theCatalogueWantsASignIn'));
    }

    if (!response.ok) {
      throw new IndexerFailure(
        saying('requests.indexers.indexerClient.theIndexerAnsweredStatus', {
          status: response.status.toString(),
        }),
      );
    }

    return response;
  };

  const templateOf = async (catalogue: Catalogue): Promise<string> => {
    const key = `${catalogue.id}:${catalogue.url}`;
    const known = templates.get(key);

    if (known !== undefined) {
      return known;
    }

    const feed = readOpdsFeed(await (await read(catalogue, catalogue.url)).text(), catalogue.url);
    const link = feed.searchLink;
    const template =
      link === null
        ? null
        : link.type.startsWith('application/opensearchdescription+xml')
          ? readOpenSearchTemplate(await (await read(catalogue, link.href)).text(), link.href)
          : link.href.includes('{searchTerms}')
            ? link.href
            : null;

    if (template === null) {
      throw new IndexerFailure(saying('requests.opds.opdsCatalogue.theCatalogueOffersNoSearch'));
    }

    templates.set(key, template);

    return template;
  };

  return {
    capabilities: async (catalogue: Catalogue): Promise<IndexerCapabilities> => {
      templates.delete(`${catalogue.id}:${catalogue.url}`);
      await templateOf(catalogue);

      return BOOK_CAPABILITIES;
    },

    search: async (catalogue: Catalogue, query: string): Promise<Release[]> => {
      if (query.trim() === '') {
        return [];
      }

      const address = (await templateOf(catalogue))
        .replaceAll('{searchTerms}', encodeURIComponent(query.trim()))
        .replace(/\{[^}]+\?\}/g, '');
      const feed = readOpdsFeed(await (await read(catalogue, address)).text(), address);
      const followed = [];

      for (const bookFeed of feed.bookFeeds.slice(0, MOST_BOOK_FEEDS)) {
        followed.push(
          ...readOpdsFeed(await (await read(catalogue, bookFeed)).text(), bookFeed).entries,
        );
      }

      return releasesOfOpds([...feed.entries, ...followed], catalogue);
    },

    download: async (catalogue: Catalogue, url: string): Promise<ReleaseFile> => {
      await wait(catalogue);

      return measureLink(fetch, url, catalogue.timeoutSeconds);
    },
  };
};

type OpdsCatalogue = ReturnType<typeof createOpdsCatalogue>;

export type { OpdsCatalogue };

export { createOpdsCatalogue };

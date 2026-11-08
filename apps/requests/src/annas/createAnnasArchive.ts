import { createHash } from 'node:crypto';
import { z } from 'zod';
import { readAnnasResults } from '@ValenceRequests/annas/readAnnasResults';
import { BROWSER_USER_AGENT } from '@ValenceRequests/cardigann/BROWSER_USER_AGENT';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { BOOK_CAPABILITIES } from '@ValenceRequests/opds/BOOK_CAPABILITIES';
import { BOOK_FILE_TYPES } from '@ValenceRequests/opds/BOOK_FILE_TYPES';
import { directBookRelease } from '@ValenceRequests/opds/directBookRelease';
import { measureLink } from '@ValenceRequests/opds/measureLink';
import type { Solution, Solver } from '@ValenceRequests/solver/createSolver';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';
import type { IndexerCapabilities, Release } from '@ValenceContracts/schemas/Indexer';
import { saying } from '@ValenceI18n/saying';

type ArchiveFetch = (
  url: string,
  init: {
    method?: string;
    headers: Record<string, string>;
    body?: string;
    redirect?: 'manual' | 'follow' | 'error';
    signal: AbortSignal;
  },
) => Promise<Response>;

type Archive = {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  timeoutSeconds: number;
  requestsPerMinute: number | null;
};

type Session = { cookies: Record<string, string>; at: number; isBrowsed: boolean };

const SESSION_MILLISECONDS = 6 * 60 * 60 * 1000;

const MOST_REDIRECTS = 5;

const MOST_RESULTS = 50;

const BOOK_TYPES = new Map(Object.values(BOOK_FILE_TYPES).map((type) => [type.extension, type]));

const FastDownloadSchema = z.object({
  download_url: z.string().url().nullable().optional(),
  error: z.string().nullable().optional(),
});

/**
 * Whether Anna's Archive answered with its bot check rather than the page: DDoS-Guard refusing
 * outright, or sending the request back to itself to be checked, as it does once a sign-in has
 * lapsed.
 *
 * @param response - The answer.
 * @returns Whether it is the bot check.
 */
const isBotCheck = (response: Response): boolean =>
  (response.status === 403 && /ddos-guard/i.test(response.headers.get('server') ?? '')) ||
  (response.status >= 300 &&
    response.status < 400 &&
    /[?&]check=1/.test(response.headers.get('location') ?? ''));

/**
 * The address of a mirror of Anna's Archive with nothing after its host.
 *
 * @param archive - The indexer.
 * @returns The mirror's origin.
 */
const originOf = (archive: Archive): string => new URL(archive.url).origin;

/**
 * Speaks to Anna's Archive: signs in with the account's secret key and keeps only the session it is
 * given, for a few hours; asks its pages directly until DDoS-Guard's bot check stands in the way, and
 * from then on through the service's own browser, carrying the session, which gets past it; searches it and turns the
 * books it finds that Valence files as books into releases; and, for a release to be downloaded,
 * asks for a member's fast download link and reads how big it is, for the direct download client
 * to fetch.
 *
 * @param fetch - How to ask.
 * @param wait - Waits for the indexer's turn, so it is asked no faster than its limit allows.
 * @param solver - The browser that gets past the bot check, or nothing where there is none.
 * @returns The Anna's Archive client.
 */
const createAnnasArchive = (
  fetch: ArchiveFetch,
  wait: (archive: Archive) => Promise<void>,
  solver: Pick<Solver, 'fetch'> | null = null,
) => {
  const sessions = new Map<string, Session>();

  const headers = { 'user-agent': BROWSER_USER_AGENT, 'accept-language': 'en-US,en;q=0.9' };

  const sessionKeyOf = (archive: Archive): string =>
    createHash('sha256')
      .update(`${archive.apiKey}\n${originOf(archive)}`)
      .digest('hex');

  const cookieOf = (session: Session): string =>
    Object.entries(session.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

  const ask = async (
    archive: Archive,
    url: string,
    init: { method?: string; headers: Record<string, string>; body?: string },
  ): Promise<Response> => {
    await wait(archive);

    try {
      return await fetch(url, {
        ...init,
        headers: { ...headers, ...init.headers },
        redirect: 'manual',
        signal: AbortSignal.timeout(archive.timeoutSeconds * 1000),
      });
    } catch {
      throw new IndexerFailure(
        saying('requests.indexers.indexerService.theIndexerCouldNotBeAsked'),
      );
    }
  };

  const sessionOf = async (archive: Archive, isFresh: boolean): Promise<Session> => {
    const key = sessionKeyOf(archive);
    const known = sessions.get(key);

    if (!isFresh && known !== undefined && Date.now() - known.at < SESSION_MILLISECONDS) {
      return known;
    }

    if (archive.apiKey === '') {
      const anonymous = { cookies: {}, at: Date.now(), isBrowsed: known?.isBrowsed ?? false };

      sessions.set(key, anonymous);

      return anonymous;
    }

    const response = await ask(archive, `${originOf(archive)}/account/`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ key: archive.apiKey }).toString(),
    });

    await response.body?.cancel().catch(() => undefined);

    const cookies = Object.fromEntries(
      response.headers.getSetCookie().flatMap((each) => {
        const pair = each.split(';')[0]?.trim() ?? '';
        const split = pair.indexOf('=');

        return pair.startsWith('aa_') && split > 0
          ? [[pair.slice(0, split), pair.slice(split + 1)]]
          : [];
      }),
    );

    if (!Object.keys(cookies).some((name) => name.startsWith('aa_account_id'))) {
      sessions.delete(key);

      throw new IndexerFailure(
        isBotCheck(response)
          ? saying('requests.annas.annasArchive.aBotCheckStoodInTheWay')
          : saying('requests.annas.annasArchive.theAccountKeyWasRefused'),
      );
    }

    const session = { cookies, at: Date.now(), isBrowsed: known?.isBrowsed ?? false };

    sessions.set(key, session);

    return session;
  };

  const browse = async (archive: Archive, session: Session, address: string): Promise<string> => {
    if (solver === null) {
      throw new IndexerFailure(saying('requests.annas.annasArchive.aBotCheckStoodInTheWay'));
    }

    await wait(archive);

    let solution: Solution;

    try {
      solution = await solver.fetch(
        { url: address, method: 'GET', body: null, headers: {} },
        { ...session.cookies },
        sessionKeyOf(archive),
      );
    } catch (error) {
      session.isBrowsed = false;

      throw error instanceof IndexerFailure
        ? error
        : new IndexerFailure(
            saying('requests.cardigann.siteClient.theBrowserThatGetsPastCloudflares'),
            'CloudflareCheckFailed',
          );
    }

    session.isBrowsed = true;
    Object.assign(session.cookies, solution.cookies);

    if (solution.status < 200 || solution.status >= 300) {
      throw new IndexerFailure(
        saying('requests.indexers.indexerClient.theIndexerAnsweredStatus', {
          status: solution.status.toString(),
        }),
      );
    }

    return solution.bytes.toString('utf8');
  };

  const page = async (archive: Archive, address: string, isFresh = false): Promise<string> => {
    const session = await sessionOf(archive, isFresh);

    if (session.isBrowsed) {
      return browse(archive, session, address);
    }

    let current = new URL(address);

    for (let hop = 0; hop <= MOST_REDIRECTS; hop += 1) {
      const cookie = cookieOf(session);
      const response = await ask(archive, current.toString(), {
        headers: cookie === '' ? {} : { cookie },
      });

      if (isBotCheck(response)) {
        await response.body?.cancel().catch(() => undefined);

        return browse(archive, session, address);
      }

      const location = response.headers.get('location');

      if (response.status >= 300 && response.status < 400 && location !== null) {
        await response.body?.cancel().catch(() => undefined);
        current = new URL(location, current);

        continue;
      }

      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);

        throw new IndexerFailure(
          saying('requests.indexers.indexerClient.theIndexerAnsweredStatus', {
            status: response.status.toString(),
          }),
        );
      }

      return response.text();
    }

    throw new IndexerFailure(saying('requests.annas.annasArchive.tooManyRedirects'));
  };

  return {
    capabilities: async (archive: Archive): Promise<IndexerCapabilities> => {
      await page(archive, `${originOf(archive)}/search?q=`, archive.apiKey !== '');

      return BOOK_CAPABILITIES;
    },

    search: async (archive: Archive, query: string): Promise<Release[]> => {
      if (query.trim() === '') {
        return [];
      }

      const address = new URL('/search', originOf(archive));

      address.searchParams.set('q', query.trim());

      return readAnnasResults(await page(archive, address.toString()))
        .slice(0, MOST_RESULTS)
        .flatMap((result) => {
          const type = result.extension === null ? undefined : BOOK_TYPES.get(result.extension);
          const infoUrl = `${originOf(archive)}/md5/${result.md5}`;

          return type === undefined
            ? []
            : [
                directBookRelease(
                  {
                    key: result.md5,
                    title: result.title,
                    authors: result.authors,
                    label: type.label,
                    isHeard: type.isHeard,
                    sizeBytes: result.sizeBytes,
                    publishedAt: result.year === null ? null : `${result.year}-01-01T00:00:00Z`,
                    downloadUrl: infoUrl,
                    infoUrl,
                  },
                  archive,
                ),
              ];
        });
    },

    download: async (archive: Archive, url: string): Promise<ReleaseFile> => {
      const md5 = /\/md5\/([a-f0-9]{32})(?:[/?#]|$)/.exec(url)?.[1];

      if (md5 === undefined) {
        throw new IndexerFailure(saying('requests.annas.annasArchive.thatIsNotABookOnAnnas'));
      }

      if (archive.apiKey === '') {
        throw new IndexerFailure(saying('requests.annas.annasArchive.downloadingNeedsAMembersKey'));
      }

      const address = new URL('/dyn/api/fast_download.json', originOf(archive));

      address.searchParams.set('md5', md5);
      address.searchParams.set('key', archive.apiKey);

      const response = await ask(archive, address.toString(), {
        headers: { accept: 'application/json' },
      });
      const read = FastDownloadSchema.safeParse(await response.json().catch(() => null));
      const link = read.success ? read.data.download_url : null;

      if (!response.ok || link === null || link === undefined) {
        const reason = read.success ? (read.data.error ?? '') : '';

        throw new IndexerFailure(
          /key/i.test(reason)
            ? saying('requests.annas.annasArchive.theAccountKeyWasRefused')
            : saying('requests.annas.annasArchive.noDownloadLinkWasGiven', {
                status: response.status.toString(),
              }),
        );
      }

      await wait(archive);

      return measureLink(fetch, link, archive.timeoutSeconds);
    },
  };
};

type AnnasArchive = ReturnType<typeof createAnnasArchive>;

export type { AnnasArchive, ArchiveFetch };

export { createAnnasArchive };

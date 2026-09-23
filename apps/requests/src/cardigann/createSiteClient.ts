import { randomUUID } from 'node:crypto';
import iconv from 'iconv-lite';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { isCloudflareChallenge } from '@ValenceRequests/cardigann/isCloudflareChallenge';
import type { SiteRequest } from '@ValenceRequests/cardigann/SiteRequest';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';
import type { Solver } from '@ValenceRequests/solver/createSolver';

type SiteFetch = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    redirect: 'manual';
    signal: AbortSignal;
  },
) => Promise<Response>;

type SiteResponse = {
  status: number;
  url: string;
  redirectedTo: string | null;
  contentType: string | null;
  body: string;
  bytes: Uint8Array;
};

type SendOptions = {
  session: SiteSession;
  encoding: string;
  timeoutSeconds: number;
  followRedirects: boolean;
  referer?: string | null;
};

type CreateSiteClientOptions = {
  fetch: SiteFetch;
  solver?: Pick<Solver, 'fetch'> | null;
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const MOST_REDIRECTS = 10;

/**
 * Reads a page's bytes in the character set it declares, or else the one its definition names, or
 * else UTF-8.
 *
 * @param bytes - The page.
 * @param contentType - Its `Content-Type` header.
 * @param encoding - The character set its definition names.
 * @returns The page as text.
 */
const readText = (bytes: Uint8Array, contentType: string | null, encoding: string): string => {
  const charset = /charset=([\w-]+)/i.exec(contentType ?? '')?.[1];
  const chosen =
    [charset, encoding].find((one) => one !== undefined && iconv.encodingExists(one)) ?? 'utf8';

  return iconv.decode(Buffer.from(bytes), chosen);
};

/**
 * Takes the cookies a response set into the session, and drops any it expired.
 *
 * @param session - The session, which this changes.
 * @param response - The response.
 */
const keepCookies = (session: SiteSession, response: Response): void => {
  for (const line of response.headers.getSetCookie()) {
    const [pair = '', ...attributes] = line.split(';');
    const at = pair.indexOf('=');
    const name = pair.slice(0, at).trim();
    const value = pair.slice(at + 1).trim();
    const isExpired = attributes.some((attribute) => {
      const [key = '', text = ''] = attribute.split('=').map((part) => part.trim().toLowerCase());

      return (
        (key === 'max-age' && Number(text) <= 0) ||
        (key === 'expires' && Date.parse(text) < Date.now())
      );
    });

    if (name === '') {
      continue;
    }

    if (isExpired || value === 'deleted') {
      delete session.cookies[name];
    } else {
      session.cookies[name] = value;
    }
  }
};

/**
 * Speaks to the sites definitions describe, the way a browser would: with the session's cookies,
 * following redirects itself so that no cookie set along the way is lost, and reading pages in the
 * site's own character set.
 *
 * A site behind Cloudflare's browser check is asked again through the service's own browser, and
 * the cookies and browser it got past the check with are kept for the requests after. From then on
 * that site's requests go straight to the browser, which the site now trusts, where a request from
 * here would only be checked again — all but those that must not follow a redirect, which a
 * browser's page cannot read, and which are asked as before.
 *
 * @param fetch - How to ask.
 * @param solver - The browser that gets past the check, or nothing where there is none.
 * @returns The client.
 */
const createSiteClient = ({ fetch, solver = null }: CreateSiteClientOptions) => {
  const throughTheBrowser = new Set<string>();
  const sessionIds = new WeakMap<SiteSession, string>();

  const idOf = (session: SiteSession): string => {
    const known = sessionIds.get(session);

    if (known !== undefined) {
      return known;
    }

    const made = randomUUID();

    sessionIds.set(session, made);

    return made;
  };

  const solve = async (
    request: SiteRequest,
    options: SendOptions,
    from: string,
  ): Promise<SiteResponse> => {
    if (solver === null) {
      throw new IndexerFailure(
        'The site is behind Cloudflare’s browser check, and this service has no browser to get past it.',
      );
    }

    const { host } = new URL(request.url);
    let solution: Awaited<ReturnType<Solver['fetch']>>;

    try {
      solution = await solver.fetch(request, { ...options.session.cookies }, idOf(options.session));
    } catch (error) {
      throughTheBrowser.delete(host);
      throw error instanceof IndexerFailure
        ? error
        : new IndexerFailure('The browser that gets past Cloudflare’s check could not be started');
    }

    Object.assign(options.session.cookies, solution.cookies);
    options.session.userAgent = solution.userAgent;
    throughTheBrowser.add(host);

    const contentType = solution.headers['content-type'] ?? null;

    return {
      status: solution.status,
      url: solution.url,
      redirectedTo: solution.url === from ? null : solution.url,
      contentType,
      body: readText(solution.bytes, contentType, options.encoding),
      bytes: solution.bytes,
    };
  };

  const send = async (request: SiteRequest, options: SendOptions): Promise<SiteResponse> => {
    let current = request;

    for (let hops = 0; hops <= MOST_REDIRECTS; hops += 1) {
      if (options.followRedirects && throughTheBrowser.has(new URL(current.url).host)) {
        return solve(current, options, request.url);
      }

      const cookie = Object.entries(options.session.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
      let response: Response;

      try {
        response = await fetch(current.url, {
          method: current.method,
          headers: {
            'user-agent': options.session.userAgent ?? USER_AGENT,
            accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
            ...(options.referer === undefined || options.referer === null
              ? {}
              : { referer: options.referer }),
            ...(cookie === '' ? {} : { cookie }),
            ...(current.body === null
              ? {}
              : { 'content-type': 'application/x-www-form-urlencoded' }),
            ...current.headers,
          },
          ...(current.body === null ? {} : { body: current.body }),
          redirect: 'manual',
          signal: AbortSignal.timeout(options.timeoutSeconds * 1000),
        });
      } catch (error) {
        throw new IndexerFailure(
          error instanceof Error && error.name === 'TimeoutError'
            ? `The site did not answer within ${options.timeoutSeconds.toString()} seconds`
            : 'The site could not be reached',
        );
      }

      keepCookies(options.session, response);

      const location = response.headers.get('location');

      if (response.status >= 300 && response.status < 400 && location !== null) {
        const next = new URL(location, current.url).toString();

        if (!options.followRedirects) {
          return {
            status: response.status,
            url: current.url,
            redirectedTo: next,
            contentType: response.headers.get('content-type'),
            body: '',
            bytes: new Uint8Array(),
          };
        }

        const keepsMethod = response.status === 307 || response.status === 308;

        current = keepsMethod
          ? { ...current, url: next }
          : { url: next, method: 'GET', body: null, headers: current.headers };
        continue;
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const body = readText(bytes, response.headers.get('content-type'), options.encoding);

      if (isCloudflareChallenge(response.status, response.headers.get('server'), body)) {
        return solve(current, options, request.url);
      }

      return {
        status: response.status,
        url: current.url,
        redirectedTo: current.url === request.url ? null : current.url,
        contentType: response.headers.get('content-type'),
        body,
        bytes,
      };
    }

    throw new IndexerFailure('The site redirected too many times');
  };

  return { send };
};

type SiteClient = ReturnType<typeof createSiteClient>;

export type { SendOptions, SiteClient, SiteFetch, SiteResponse };

export { createSiteClient };

import iconv from 'iconv-lite';
import { z } from 'zod';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { isCloudflareChallenge } from '@ValenceRequests/cardigann/isCloudflareChallenge';
import type { SiteRequest } from '@ValenceRequests/cardigann/SiteRequest';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';

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
  flareSolverrUrl?: string;
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const MOST_REDIRECTS = 10;

const SolutionSchema = z.object({
  status: z.string(),
  message: z.string().default(''),
  solution: z
    .object({
      url: z.string(),
      status: z.number(),
      response: z.string().default(''),
      cookies: z.array(z.object({ name: z.string(), value: z.string() })).default([]),
      userAgent: z.string().default(USER_AGENT),
    })
    .optional(),
});

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
 * A site behind Cloudflare's browser check is asked again through FlareSolverr where one is set up,
 * and the cookies and browser it was solved with are kept for the requests after. Where none is set
 * up, it says so.
 *
 * @param fetch - How to ask.
 * @param flareSolverrUrl - Where FlareSolverr answers, or nothing.
 * @returns The client.
 */
const createSiteClient = ({ fetch, flareSolverrUrl = '' }: CreateSiteClientOptions) => {
  const solve = async (request: SiteRequest, options: SendOptions): Promise<SiteResponse> => {
    if (flareSolverrUrl === '') {
      throw new IndexerFailure(
        'The site is behind Cloudflare’s browser check. Set FLARESOLVERR_URL on the requests service to get past it.',
      );
    }

    let answer: Response;

    try {
      answer = await fetch(`${flareSolverrUrl.replace(/\/+$/, '')}/v1`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cmd: request.method === 'POST' ? 'request.post' : 'request.get',
          url: request.url,
          maxTimeout: 60_000,
          cookies: Object.entries(options.session.cookies).map(([name, value]) => ({
            name,
            value,
          })),
          ...(request.method === 'POST' ? { postData: request.body ?? '' } : {}),
        }),
        redirect: 'manual',
        signal: AbortSignal.timeout(90_000),
      });
    } catch {
      throw new IndexerFailure('FlareSolverr could not be reached');
    }

    const read = SolutionSchema.safeParse(await answer.json().catch(() => ({})));

    if (!read.success || read.data.solution === undefined) {
      throw new IndexerFailure(
        `FlareSolverr could not get past the site’s browser check${read.success && read.data.message !== '' ? `: ${read.data.message}` : ''}`,
      );
    }

    const { solution } = read.data;

    for (const cookie of solution.cookies) {
      options.session.cookies[cookie.name] = cookie.value;
    }

    options.session.userAgent = solution.userAgent;

    return {
      status: solution.status,
      url: solution.url,
      redirectedTo: null,
      contentType: 'text/html',
      body: solution.response,
      bytes: Buffer.from(solution.response),
    };
  };

  const send = async (request: SiteRequest, options: SendOptions): Promise<SiteResponse> => {
    let current = request;

    for (let hops = 0; hops <= MOST_REDIRECTS; hops += 1) {
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
      const charset = /charset=([\w-]+)/i.exec(response.headers.get('content-type') ?? '')?.[1];
      const encoding =
        [charset, options.encoding].find((one) => one !== undefined && iconv.encodingExists(one)) ??
        'utf8';
      const body = iconv.decode(Buffer.from(bytes), encoding);

      if (isCloudflareChallenge(response.status, response.headers.get('server'), body)) {
        return solve(current, options);
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

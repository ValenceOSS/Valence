import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { inTime } from '@ValenceRequests/solver/inTime';
import { solveRequest } from '@ValenceRequests/solver/solveRequest';
import type { SiteRequest } from '@ValenceRequests/cardigann/SiteRequest';
import type { SiteAgent } from '@ValenceRequests/solver/createSiteAgent';
import type { SitePool } from '@ValenceRequests/solver/createSitePool';
import type { SitePage } from '@ValenceRequests/solver/toSitePage';

type Agent = Pick<
  SiteAgent,
  'withPage' | 'addCookies' | 'cookies' | 'userAgent' | 'busy' | 'isOpen' | 'close'
>;

type Solution = {
  url: string;
  status: number;
  headers: Record<string, string>;
  bytes: Buffer;
  cookies: Record<string, string>;
  userAgent: string;
};

type CreateSolverOptions<A extends Agent> = {
  pool: Pick<SitePool<A>, 'use'>;
  timeoutMs?: number;
  now?: () => number;
};

const A_FORM = 'application/x-www-form-urlencoded';

const THE_BROWSERS_OWN = new Set(['cookie', 'host', 'referer', 'user-agent']);

/**
 * Fetches a page past its site's browser check, in a browser of the service's own. Each site has an
 * agent for each session asking of it, so one indexer's requests share what the check left behind
 * for it, and never another indexer's login.
 *
 * The headers the browser sets itself — who it is, its cookies, where it came from — are left to it,
 * since a request claiming to be another browser is exactly what the check looks for.
 *
 * A request that runs out of time has its tab closed, so that a tab stuck at the check never holds
 * up the ones after it, and one whose tab only came once its time had gone does nothing with it.
 *
 * @param pool - The agents, one to a site.
 * @param timeoutMs - How long a request may take, check and all.
 * @param now - The clock.
 * @returns The solver.
 */
const createSolver = <A extends Agent>({
  pool,
  timeoutMs = 60_000,
  now = Date.now,
}: CreateSolverOptions<A>) => {
  const timedOut = (): IndexerFailure =>
    new IndexerFailure(
      `Timed out after ${Math.round(timeoutMs / 1000).toString()} seconds getting past the site’s browser check`,
      'CloudflareCheckFailed',
    );

  const fetch = (
    request: SiteRequest,
    cookies: Record<string, string>,
    session: string,
  ): Promise<Solution> => {
    const deadline = now() + timeoutMs;
    const { origin, hostname } = new URL(request.url);
    const headers = Object.fromEntries(
      Object.entries(request.headers).filter(([name]) => !THE_BROWSERS_OWN.has(name.toLowerCase())),
    );
    let using: SitePage | null = null;

    return inTime(
      pool.use(`${hostname} ${session}`, (agent) =>
        agent.withPage(async (page) => {
          if (now() >= deadline) {
            throw timedOut();
          }

          using = page;
          await agent.addCookies(
            Object.entries(cookies).map(([name, value]) => ({ name, value })),
            origin,
          );

          const { answer, bytes } = await solveRequest({
            page,
            request: {
              url: request.url,
              method: request.method,
              body: request.body,
              headers: request.body === null ? headers : { 'content-type': A_FORM, ...headers },
            },
            deadline,
            now,
          });
          const [held, userAgent] = await Promise.all([
            agent.cookies(answer.url),
            agent.userAgent(page),
          ]);

          return {
            url: answer.url,
            status: answer.status,
            headers: answer.headers,
            bytes,
            cookies: Object.fromEntries(held.map((cookie) => [cookie.name, cookie.value])),
            userAgent,
          };
        }),
      ),
      timeoutMs,
      {
        failure: timedOut,
        onLate: () => {
          void using?.close().catch(() => {});
        },
      },
    );
  };

  return { fetch };
};

type Solver = ReturnType<typeof createSolver>;

export type { Solution, Solver };

export { createSolver };

import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { solveRequest } from '@ValenceRequests/solver/solveRequest';
import type { SiteRequest } from '@ValenceRequests/cardigann/SiteRequest';
import type { SiteAgent } from '@ValenceRequests/solver/createSiteAgent';
import type { SitePool } from '@ValenceRequests/solver/createSitePool';

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
 * Gives up on a task that runs past its time.
 *
 * @param task - The task.
 * @param ms - How long it has.
 * @returns What it gave, if it gave it in time.
 */
const inTime = async <T>(task: Promise<T>, ms: number): Promise<T> => {
  let handle: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        handle = setTimeout(() => {
          reject(
            new IndexerFailure(
              `Timed out after ${Math.round(ms / 1000).toString()} seconds getting past the site’s browser check`,
            ),
          );
        }, ms);
      }),
    ]);
  } finally {
    clearTimeout(handle);
  }
};

/**
 * Fetches a page past its site's browser check, in a browser of the service's own: each site has
 * its own agent in it, so everything asked of one site shares what that site's check left behind.
 *
 * The headers the browser sets itself — who it is, its cookies, where it came from — are left to it,
 * since a request claiming to be another browser is exactly what the check looks for.
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
  const fetch = (request: SiteRequest, cookies: Record<string, string>): Promise<Solution> => {
    const deadline = now() + timeoutMs;
    const { origin, hostname } = new URL(request.url);
    const headers = Object.fromEntries(
      Object.entries(request.headers).filter(([name]) => !THE_BROWSERS_OWN.has(name.toLowerCase())),
    );

    return inTime(
      pool.use(hostname, (agent) =>
        agent.withPage(async (page) => {
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
    );
  };

  return { fetch };
};

type Solver = ReturnType<typeof createSolver>;

export type { Solution, Solver };

export { createSolver };

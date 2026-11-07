import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { createGate } from '@ValenceRequests/solver/createGate';
import { inTime } from '@ValenceRequests/solver/inTime';
import { solveRequest } from '@ValenceRequests/solver/solveRequest';
import type { SiteRequest } from '@ValenceRequests/cardigann/SiteRequest';
import type { SiteAgent } from '@ValenceRequests/solver/createSiteAgent';
import type { SitePool } from '@ValenceRequests/solver/createSitePool';
import type { SitePage } from '@ValenceRequests/solver/toSitePage';
import { saying } from '@ValenceI18n/saying';

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
  pool: Pick<SitePool<A>, 'use' | 'forget'>;
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
 * Any request that fails closes its agent too, so the next one starts from a fresh browser context
 * rather than one the site may have marked.
 *
 * The browser takes one request at a time, and a request's time starts when its turn comes. Firefox
 * working several checks at once leaves Cloudflare's check unable to finish in any of them: a search
 * across three sites behind it, on a browser that had just started, timed out on all three together,
 * every time, while each passed in seconds when asked alone. Waiting behind the others is not held
 * against a request, so one asked alongside several still has its full time to pass.
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
      saying('requests.solver.timedOutGettingPast', {
        seconds: Math.round(timeoutMs / 1000).toString(),
      }),
      'CloudflareCheckFailed',
    );

  const turns = createGate(1);

  const fetchNow = async (
    request: SiteRequest,
    cookies: Record<string, string>,
    session: string,
  ): Promise<Solution> => {
    const deadline = now() + timeoutMs;
    const { origin, hostname } = new URL(request.url);
    const headers = Object.fromEntries(
      Object.entries(request.headers).filter(([name]) => !THE_BROWSERS_OWN.has(name.toLowerCase())),
    );
    const key = `${hostname} ${session}`;
    let using: SitePage | null = null;

    return inTime(
      pool.use(key, async (agent) => {
        try {
          return await agent.withPage(async (page) => {
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
          });
        } catch (error) {
          await pool.forget(key, agent);
          throw error;
        }
      }),
      timeoutMs,
      {
        failure: timedOut,
        onLate: () => {
          void using?.close().catch(() => {});
        },
      },
    );
  };

  const fetch = (
    request: SiteRequest,
    cookies: Record<string, string>,
    session: string,
  ): Promise<Solution> => turns.run(() => fetchNow(request, cookies, session));

  return { fetch };
};

type Solver = ReturnType<typeof createSolver>;

export type { Solution, Solver };

export { createSolver };

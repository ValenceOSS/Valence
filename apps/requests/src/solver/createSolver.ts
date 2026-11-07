import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { askThrough } from '@ValenceRequests/solver/askThrough';
import type { Solved } from '@ValenceRequests/solver/askThrough';
import { createGate } from '@ValenceRequests/solver/createGate';
import { inTime } from '@ValenceRequests/solver/inTime';
import { solveRequest } from '@ValenceRequests/solver/solveRequest';
import type { SiteRequest } from '@ValenceRequests/cardigann/SiteRequest';
import type { PageRequest } from '@ValenceRequests/solver/PageRequest';
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
  pool: Pick<SitePool<A>, 'use' | 'forget' | 'has'>;
  timeoutMs?: number;
  now?: () => number;
};

const A_FORM = 'application/x-www-form-urlencoded';

const THE_BROWSERS_OWN = new Set(['cookie', 'host', 'referer', 'user-agent']);

const THE_CHECKS_OWN: ReadonlySet<ProblemCode> = new Set([
  'CloudflareCheckFailed',
  'CloudflareRefusesAddress',
]);

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
 * The browser goes through one check at a time, and a request's time starts when its turn comes.
 * Firefox working several checks at once leaves Cloudflare's check unable to finish in any of them:
 * a search across three sites behind it, on a browser that had just started, timed out on all three
 * together, every time, while each passed in seconds when asked alone. Waiting behind the others is
 * not held against a request, so one asked alongside several still has its full time to pass.
 *
 * A site the session is already through asks straight away from the tab it left there, alongside
 * whatever else the browser is doing, and waits its turn only where the check shows again. When a
 * site's check fails, the requests for it already waiting fail with it rather than each spending its
 * own time on a check that has just failed; one asked after that has a fresh try.
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
  const failedChecks = new Map<string, { failure: IndexerFailure; upTo: number }>();
  let waited = 0;

  const inAgent = async <T>(
    request: SiteRequest,
    cookies: Record<string, string>,
    session: string,
    work: (agent: A, page: SitePage, asking: PageRequest, deadline: number) => Promise<T>,
  ): Promise<T> => {
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

            return work(
              agent,
              page,
              {
                url: request.url,
                method: request.method,
                body: request.body,
                headers: request.body === null ? headers : { 'content-type': A_FORM, ...headers },
              },
              deadline,
            );
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

  const solutionOf = async (agent: A, page: SitePage, solved: Solved): Promise<Solution> => {
    const [held, userAgent] = await Promise.all([
      agent.cookies(solved.answer.url),
      agent.userAgent(page),
    ]);

    return {
      url: solved.answer.url,
      status: solved.answer.status,
      headers: solved.answer.headers,
      bytes: solved.bytes,
      cookies: Object.fromEntries(held.map((cookie) => [cookie.name, cookie.value])),
      userAgent,
    };
  };

  const noted = async <T>(hostname: string, asking: Promise<T>): Promise<T> => {
    try {
      return await asking;
    } catch (error) {
      if (
        error instanceof IndexerFailure &&
        error.problemCode !== null &&
        THE_CHECKS_OWN.has(error.problemCode)
      ) {
        failedChecks.set(hostname, { failure: error, upTo: waited });
      }

      throw error;
    }
  };

  const fetch = async (
    request: SiteRequest,
    cookies: Record<string, string>,
    session: string,
  ): Promise<Solution> => {
    const { origin, hostname } = new URL(request.url);

    if (pool.has(`${hostname} ${session}`)) {
      const straightAway = await noted(
        hostname,
        inAgent(request, cookies, session, async (agent, page, asking) => {
          const solved = page.origin() === origin ? await askThrough(page, asking) : null;

          return solved === null ? null : solutionOf(agent, page, solved);
        }),
      );

      if (straightAway !== null) {
        return straightAway;
      }
    }

    waited += 1;

    const ticket = waited;

    return turns.run(() => {
      const failed = failedChecks.get(hostname);

      if (failed !== undefined && ticket <= failed.upTo) {
        return Promise.reject(new IndexerFailure(failed.failure.said, failed.failure.problemCode));
      }

      return noted(
        hostname,
        inAgent(request, cookies, session, async (agent, page, asking, deadline) =>
          solutionOf(agent, page, await solveRequest({ page, request: asking, deadline, now })),
        ),
      );
    });
  };

  return { fetch };
};

type Solver = ReturnType<typeof createSolver>;

export type { Solution, Solver };

export { createSolver };

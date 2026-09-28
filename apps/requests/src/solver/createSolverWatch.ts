import type { RequestsSolver } from '@ValenceContracts/schemas/Requests';
import type { Solver } from '@ValenceRequests/solver/createSolver';

type CreateSolverWatchOptions = {
  isRunning: () => boolean;
  runningFor: () => number;
  sites: () => number;
  now?: () => number;
};

/**
 * Keeps the last word on the browser that gets past Cloudflare's check: whether it is running, how
 * many sites it has open, how its requests have gone since the service started, and why it last
 * failed to start. The browser opens only when a site asks for it and closes when none has for a
 * while, so not running is not a fault; failing to start is.
 *
 * @param isRunning - Whether the browser is up now.
 * @param runningFor - How long it has been up, in milliseconds.
 * @param sites - How many sites it has open.
 * @param now - The clock.
 * @returns The watch: wrap the launch in `starting`, the solver in `watching`, and read `current`.
 */
const createSolverWatch = ({
  isRunning,
  runningFor,
  sites,
  now = Date.now,
}: CreateSolverWatchOptions) => {
  let passed = 0;
  let failed = 0;
  let lastPassedAt: number | null = null;
  let lastFailedAt: number | null = null;
  let problem: string | null = null;
  let startProblem: string | null = null;

  const starting =
    <T>(launch: () => Promise<T>) =>
    async (): Promise<T> => {
      try {
        const browser = await launch();

        startProblem = null;

        return browser;
      } catch (cause) {
        startProblem = cause instanceof Error ? cause.message : String(cause);

        throw cause;
      }
    };

  const watching = (solver: Solver): Solver => ({
    fetch: async (request, cookies, session) => {
      try {
        const solution = await solver.fetch(request, cookies, session);

        passed += 1;
        lastPassedAt = now();

        return solution;
      } catch (cause) {
        failed += 1;
        lastFailedAt = now();
        problem = cause instanceof Error ? cause.message : String(cause);

        throw cause;
      }
    },
  });

  const current = (): RequestsSolver => {
    const running = isRunning();

    return {
      isRunning: running,
      sites: running ? sites() : 0,
      runningSince: running ? new Date(now() - runningFor()).toISOString() : null,
      passed,
      failed,
      lastPassedAt: lastPassedAt === null ? null : new Date(lastPassedAt).toISOString(),
      lastFailedAt: lastFailedAt === null ? null : new Date(lastFailedAt).toISOString(),
      problem,
      startProblem,
    };
  };

  return { starting, watching, current };
};

type SolverWatch = ReturnType<typeof createSolverWatch>;

export type { SolverWatch };

export { createSolverWatch };

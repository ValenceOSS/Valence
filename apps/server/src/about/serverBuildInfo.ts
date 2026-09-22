import { execFileSync } from 'node:child_process';
import type { About } from '@ValenceContracts/schemas/About';

/**
 * The commit this server is running, read once from the checkout it started in.
 *
 * A container built without its `.git` carries no answer at all, which is `unknown` rather than a
 * crash — an operator comparing two deployments still learns something from every other one saying
 * the real thing.
 *
 * @returns A short hash, or `unknown` where this was built somewhere that has none to give.
 */
const commitThisIsRunning = (): string => {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();
  } catch {
    return 'unknown';
  }
};

const SERVER_BUILD_INFO: About = { commit: commitThisIsRunning() };

/**
 * What this server is actually running, read once at startup rather than on every request — the
 * commit does not change while the process is up.
 *
 * @returns The commit this server was started from.
 */
const serverBuildInfo = (): About => SERVER_BUILD_INFO;

export { serverBuildInfo };

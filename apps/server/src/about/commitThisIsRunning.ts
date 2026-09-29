import { execFileSync } from 'node:child_process';

/**
 * The commit this server is running, read from the checkout it started in, for a server that was not
 * told it — one started from a clone rather than from an image, which is handed its commit as it is
 * built.
 *
 * Anywhere without a `.git` to read answers `unknown` rather than crashing.
 *
 * @returns A short hash, or `unknown` where there is none to give.
 */
const commitThisIsRunning = (): string => {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
};

export { commitThisIsRunning };

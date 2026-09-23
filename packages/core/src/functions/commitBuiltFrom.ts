import { execFileSync } from 'node:child_process';

/**
 * The commit a build is being made from, read once from the checkout doing the building.
 *
 * A packaged app carries no `.git` of its own, so this is the one moment the answer is available at
 * all — baked into the build here rather than asked for at runtime, where there would be nothing
 * left to ask. Only a build's configuration calls it; nothing that runs in an app does.
 *
 * @returns A short hash, or `unknown` where this was built somewhere that has none to give.
 */
const commitBuiltFrom = (): string => {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();
  } catch {
    return 'unknown';
  }
};

export { commitBuiltFrom };

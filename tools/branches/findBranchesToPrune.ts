import type { BranchTip, PullRequestHead } from './BranchTip';

const KEPT = ['main', 'HEAD'];

/**
 * Which branches are finished with: each one a pull request merged from, still at the very commit
 * it merged at, and with no pull request of its own still open.
 *
 * A branch that moved on after its merge holds work nobody has seen merged, so it stays however old
 * its pull request is, and so does one whose pull request was closed without merging, since that
 * is somebody's decision to read rather than a machine's to make.
 *
 * @param branches - Every branch, with the commit it is at.
 * @param pullRequests - Every pull request, open or not.
 * @param current - The branch checked out here, which is never taken away from under somebody.
 * @returns The names that can go, sorted.
 */
const findBranchesToPrune = (
  branches: readonly BranchTip[],
  pullRequests: readonly PullRequestHead[],
  current: string | null = null,
): string[] => {
  const stillOpen = new Set(
    pullRequests.filter((request) => request.state === 'OPEN').map((request) => request.branch),
  );

  const mergedAt = new Set(
    pullRequests
      .filter((request) => request.state === 'MERGED')
      .map((request) => `${request.branch}@${request.commit}`),
  );

  return branches
    .filter(
      (branch) =>
        !KEPT.includes(branch.name) &&
        branch.name !== current &&
        !stillOpen.has(branch.name) &&
        mergedAt.has(`${branch.name}@${branch.commit}`),
    )
    .map((branch) => branch.name)
    .toSorted();
};

export { findBranchesToPrune };

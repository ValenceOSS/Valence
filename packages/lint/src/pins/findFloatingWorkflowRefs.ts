const ACTION = /^\s*-?\s*uses:\s*(?<quote>["']?)(?<ref>[^\s"']+)\k<quote>/gmu;

const PINNED_ACTION = /^[^@\s]+@[0-9a-f]{40}$/u;

const LATEST_RUNNER = /\b(?<runner>(?:ubuntu|macos|windows)-latest(?:-[\w-]+)?)\b/gu;

/**
 * Lists what a GitHub workflow uses that can change without a commit here: an action named by a tag
 * or a branch rather than a commit, and a runner image named `-latest`.
 *
 * An action in this repository, or another workflow in it, is changed by a commit here, so it is
 * left alone.
 *
 * @param workflow - The contents of the workflow.
 * @returns Each floating action and runner, in order.
 */
const findFloatingWorkflowRefs = (workflow: string): string[] => {
  const actions = [...workflow.matchAll(ACTION)]
    .flatMap((found) => found.groups?.['ref'] ?? [])
    .filter((ref) => !ref.startsWith('./') && !PINNED_ACTION.test(ref));
  const runners = [...workflow.matchAll(LATEST_RUNNER)].flatMap(
    (found) => found.groups?.['runner'] ?? [],
  );

  return [...actions, ...runners];
};

export { findFloatingWorkflowRefs };

/**
 * Sums up testing several indexers at once: how many answered, and why each of the rest did not.
 *
 * @param outcomes - Each indexer's name, and why it failed or nothing where it answered.
 * @returns What to say where all answered, and the failures where any did not.
 */
const describeTestRound = (
  outcomes: readonly { name: string; failure: string | null }[],
): { done: string; failure: string | null } => {
  const failed = outcomes.flatMap(({ failure }) => (failure === null ? [] : [failure]));
  const count = outcomes.length.toString();
  const done =
    outcomes.length === 1 ? `${outcomes[0]?.name ?? 'It'} answered.` : `All ${count} answered.`;

  if (failed.length === 0) {
    return { done, failure: null };
  }

  return outcomes.length === 1
    ? { done, failure: failed.join('') }
    : {
        done,
        failure: `${(outcomes.length - failed.length).toString()} of ${count} answered. ${failed.join('; ')}`,
      };
};

export { describeTestRound };

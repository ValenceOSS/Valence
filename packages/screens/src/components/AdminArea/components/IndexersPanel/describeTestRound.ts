import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

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
  const [only] = outcomes;
  const done =
    outcomes.length === 1
      ? only === undefined
        ? say('admin.describeTestRound.itAnswered')
        : say('admin.describeTestRound.oneAnswered', { name: only.name })
      : sayCount('admin.describeTestRound.allAnswered', outcomes.length);

  if (failed.length === 0) {
    return { done, failure: null };
  }

  return outcomes.length === 1
    ? { done, failure: failed.join('') }
    : {
        done,
        failure: say('admin.describeTestRound.someAnswered', {
          answered: outcomes.length - failed.length,
          tried: outcomes.length,
          failures: failed.join('; '),
        }),
      };
};

export { describeTestRound };

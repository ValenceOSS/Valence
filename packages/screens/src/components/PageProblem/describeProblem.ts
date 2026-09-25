import { say } from '@ValenceI18n/say';

type ProblemWords = { headline: string; reason: string };

/**
 * Says why a page stopped in words somebody can act on, by what kind of failure it was, rather than
 * one sentence for every way a page can fall over.
 *
 * @param message - What the failure said, where it said anything.
 * @returns A headline, and the likely reason and what to do about it.
 */
const describeProblem = (message: string | null): ProblemWords => {
  const said = (message ?? '').toLowerCase();

  if (said.includes('dynamically imported module') || said.includes('importing a module script')) {
    return {
      headline: say('screens.describeProblem.updatedHeadline'),
      reason: say('screens.describeProblem.updatedReason'),
    };
  }

  if (
    said.includes('failed to fetch') ||
    said.includes('networkerror') ||
    said.includes('load failed')
  ) {
    return {
      headline: say('screens.describeProblem.unreachableHeadline'),
      reason: say('screens.describeProblem.unreachableReason'),
    };
  }

  if (said.includes('401') || said.includes('403') || said.includes('not allowed')) {
    return {
      headline: say('screens.describeProblem.notAllowedHeadline'),
      reason: say('screens.describeProblem.notAllowedReason'),
    };
  }

  if (said.includes('404') || said.includes('not found')) {
    return {
      headline: say('screens.describeProblem.notFoundHeadline'),
      reason: say('screens.describeProblem.notFoundReason'),
    };
  }

  return {
    headline: say('screens.describeProblem.brokenHeadline'),
    reason: say('screens.describeProblem.brokenReason'),
  };
};

export { describeProblem };
export type { ProblemWords };

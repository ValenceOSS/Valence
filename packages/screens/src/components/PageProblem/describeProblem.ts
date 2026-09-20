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
      headline: 'Valence has been updated',
      reason:
        'This page belongs to an older version than the one now running. Loading it again fetches the new one.',
    };
  }

  if (
    said.includes('failed to fetch') ||
    said.includes('networkerror') ||
    said.includes('load failed')
  ) {
    return {
      headline: 'Valence could not be reached',
      reason:
        'The server may be restarting, or this device may be offline. Check the connection and try again.',
    };
  }

  if (said.includes('401') || said.includes('403') || said.includes('not allowed')) {
    return {
      headline: 'You are not allowed to see this page',
      reason:
        'Ask whoever runs this Valence to give you access, or sign in as somebody who has it.',
    };
  }

  if (said.includes('404') || said.includes('not found')) {
    return {
      headline: 'This page could not be found',
      reason: 'It may have been moved or removed. Go back to the start and look for it from there.',
    };
  }

  return {
    headline: 'This page stopped working',
    reason:
      'Something on this page went wrong. The rest of Valence is still running, so try it again or go somewhere else.',
  };
};

export { describeProblem };
export type { ProblemWords };

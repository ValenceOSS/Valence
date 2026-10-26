import type { TroubleReason } from './SourceTrouble';

/**
 * Says what went wrong when a site answered with something other than what was asked for, or
 * nothing where it only means the site has no such thing.
 *
 * @param status - What the site answered with.
 * @returns Why it could not answer, or null where its answer is that there is nothing.
 */
const troubleFromStatus = (status: number): TroubleReason | null => {
  if (status === 429) {
    return 'rateLimited';
  }

  if (status === 401) {
    return 'keyRefused';
  }

  if (status === 403) {
    return 'refused';
  }

  return status >= 500 ? 'faulty' : null;
};

export { troubleFromStatus };

import type { ObservabilitySearch } from './ObservabilitySearchSchema';

/**
 * Lays a change over what the address already says. A field the change gives as nothing is taken
 * off the address, so that going back to a default leaves the address bare rather than spelling the
 * default out.
 *
 * @param current - What the address says now.
 * @param change - The fields to set, or with nothing to take off.
 * @returns The address's new fields.
 */
const mergeObservabilitySearch = (
  current: ObservabilitySearch,
  change: ObservabilitySearch,
): ObservabilitySearch =>
  Object.fromEntries(
    Object.entries({ ...current, ...change }).filter(([, value]) => value !== undefined),
  );

export { mergeObservabilitySearch };

import type { UseQueryResult } from '@tanstack/react-query';
import type { Freshness } from '@ValenceClient/query/Freshness';

/**
 * Whether what some answers already show is being checked against the server, and whether the last
 * check failed, for a panel that says so beside its heading.
 *
 * @param asked - The answers the panel shows.
 * @param isLookingAgain - Whether the panel is waiting on the server for any of them again.
 * @returns How fresh they are.
 */
const freshnessOf = (
  asked: readonly Pick<UseQueryResult, 'data' | 'isRefetchError'>[],
  isLookingAgain: boolean,
): Freshness => ({
  isChecking: isLookingAgain && asked.some((one) => one.data !== undefined),
  couldNotCheck: asked.some((one) => one.isRefetchError),
});

export { freshnessOf };

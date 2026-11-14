import type { GuardedFetch } from '@ValenceRequests/network/GuardedFetch';

type GuardFor = (trustedHosts: readonly string[]) => GuardedFetch;

export type { GuardFor };

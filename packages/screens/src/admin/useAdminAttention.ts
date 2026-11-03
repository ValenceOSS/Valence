import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { countHealthProblems } from './countHealthProblems';

type AdminAttention = {
  requests: number;
  failedRequests: number;
  downloads: number;
  jobs: number;
  health: number;
  latest: string | null;
};

/**
 * What is waiting on an administrator, counted the same wherever it is shown — on the overview and
 * beside the sidebar's items: requests to approve, requests that failed, download clients that are
 * not answering, jobs that failed lately, titles in the libraries with something wrong, and a newer
 * release if one is out. Reads the same queries the panels read, so counting costs nothing more
 * than showing.
 *
 * @returns The counts, each zero until it has been read, and the newer release or null.
 */
const useAdminAttention = (): AdminAttention => {
  const requesting = useQuery(requestsQueries.availability());
  const hasRequests = requesting.data?.isEnabled ?? false;
  const requests = useQuery(requestsQueries.overview(hasRequests));
  const failures = useQuery(adminQueries.recentFailures());
  const health = useQuery(adminQueries.libraryHealth());
  const updates = useQuery(adminQueries.updateCheck());
  const work = hasRequests && requests.data?.isReachable === true ? requests.data.work : null;

  return {
    requests: work?.awaitingApproval ?? 0,
    failedRequests: work?.failed ?? 0,
    downloads: work?.clients.failing.length ?? 0,
    jobs: failures.data?.total ?? 0,
    health: countHealthProblems(health.data),
    latest: updates.data?.isNewer === true ? updates.data.latest : null,
  };
};

export type { AdminAttention };

export { useAdminAttention };

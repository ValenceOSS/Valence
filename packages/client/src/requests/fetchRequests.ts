import { readFromServer } from '@ValenceClient/query/readFromServer';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import {
  RequestsAvailabilitySchema,
  RequestsOverviewSchema,
} from '@ValenceContracts/schemas/Requests';
import type { RequestsAvailability, RequestsOverview } from '@ValenceContracts/schemas/Requests';

const CHECK_PATH = '/api/admin/requests/check';

/**
 * Asks whether this server takes requests at all, which decides whether anything about requesting
 * is shown.
 *
 * @returns Whether requesting is on.
 */
const fetchRequestsAvailability = (): Promise<RequestsAvailability> =>
  readFromServer('/api/requests/availability', RequestsAvailabilitySchema);

/**
 * Reads what the server last heard from the requests service.
 *
 * @returns Where the service is, whether it answered, and how its VPN is.
 */
const fetchRequestsOverview = (): Promise<RequestsOverview> =>
  readFromServer('/api/admin/requests', RequestsOverviewSchema);

/**
 * Has the server ask the requests service how it is now, rather than waiting for the next check.
 *
 * @returns What it said.
 */
const checkRequestsNow = async (): Promise<RequestsOverview> => {
  const response = await fetch(CHECK_PATH, { method: 'POST', credentials: 'same-origin' });

  if (!response.ok) {
    throw new RequestFailed(CHECK_PATH, response.status);
  }

  return RequestsOverviewSchema.parse(await response.json());
};

export { checkRequestsNow, fetchRequestsAvailability, fetchRequestsOverview };

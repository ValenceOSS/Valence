import { createGuardedFetch } from '@ValenceRequests/network/createGuardedFetch';
import type { GuardedFetch } from '@ValenceRequests/network/GuardedFetch';

const WAIT_MS = 20_000;

/**
 * A picture from the web, such as a book's cover, where it can be fetched in good time. Only a
 * public address over HTTPS is reached, whatever a redirect says.
 *
 * @param url - Where it is.
 * @param reach - How to fetch it.
 * @returns Its bytes, or null where it could not be fetched.
 */
const fetchPicture = async (
  url: string,
  reach: GuardedFetch = createGuardedFetch()([]),
): Promise<Uint8Array | null> => {
  const response = await reach(url, { signal: AbortSignal.timeout(WAIT_MS) }).catch(() => null);

  return response?.ok === true
    ? new Uint8Array(await response.arrayBuffer().catch(() => new ArrayBuffer(0)))
    : null;
};

export { fetchPicture };

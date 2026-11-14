import { createPinnedFetch } from '@ValenceServer/web/createPinnedFetch';
import { isWebhookAddressAllowed } from './isWebhookAddressAllowed';
import { refusalOfWebhookAddress } from './refusalOfWebhookAddress';
import type { WebhookFetcher } from './deliverWebhook';
import type { Resolve } from '@ValenceServer/live/isPublicWebAddress';
import { say } from '@ValenceI18n/say';

/**
 * Builds the fetcher a delivery goes out through, which resolves the name once, checks the answer
 * and connects to that same address, so a name that changes between the check and the connection
 * gains nothing.
 *
 * @param reachesLocalNetwork - Whether the webhook is allowed to reach the local network.
 * @param resolve - What a name resolves to, in place of the system's lookup, injectable for tests.
 * @returns A fetcher that follows no redirect.
 */
const createPinnedWebhookFetcher = (
  reachesLocalNetwork: boolean,
  resolve?: Resolve,
): WebhookFetcher => {
  const pinned = createPinnedFetch(
    (address) => isWebhookAddressAllowed(address, reachesLocalNetwork),
    (addresses) =>
      new Error(
        say(
          refusalOfWebhookAddress(addresses, reachesLocalNetwork) ??
            'error.common.valenceWillNotSendDeliveriesTo',
        ),
      ),
    resolve,
  );

  return async (url, init) => {
    const response = await pinned(url, init);

    await response.body?.cancel();

    return { ok: response.ok, status: response.status };
  };
};

export { createPinnedWebhookFetcher };

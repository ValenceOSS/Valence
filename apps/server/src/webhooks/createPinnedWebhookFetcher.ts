import { createPinnedFetch } from '@ValenceServer/web/createPinnedFetch';
import { isWebhookAddressAllowed } from './isWebhookAddressAllowed';
import type { WebhookFetcher } from './deliverWebhook';
import { say } from '@ValenceI18n/say';

/**
 * Builds the fetcher a delivery goes out through, which resolves the name once, checks the answer
 * and connects to that same address, so a name that changes between the check and the connection
 * gains nothing.
 *
 * @param reachesLocalNetwork - Whether the webhook is allowed to reach the local network.
 * @returns A fetcher that follows no redirect.
 */
const createPinnedWebhookFetcher = (reachesLocalNetwork: boolean): WebhookFetcher => {
  const pinned = createPinnedFetch(
    (address) => isWebhookAddressAllowed(address, reachesLocalNetwork),
    (addresses) =>
      new Error(
        say(
          addresses.some((address) => isWebhookAddressAllowed(address, true))
            ? 'error.webhook.valenceWillNotSendToTheLocalNetwork'
            : 'error.common.valenceWillNotSendDeliveriesTo',
        ),
      ),
  );

  return async (url, init) => {
    const response = await pinned(url, init);

    await response.body?.cancel();

    return { ok: response.ok, status: response.status };
  };
};

export { createPinnedWebhookFetcher };

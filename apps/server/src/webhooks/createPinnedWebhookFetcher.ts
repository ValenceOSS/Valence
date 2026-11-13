import { isIP } from 'node:net';
import { Agent, fetch } from 'undici';
import { isWebhookAddressAllowed } from './isWebhookAddressAllowed';
import { pinnedWebhookLookup } from './pinnedWebhookLookup';
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
const createPinnedWebhookFetcher =
  (reachesLocalNetwork: boolean): WebhookFetcher =>
  async (url, init) => {
    const host = URL.parse(url)?.hostname.replace(/^\[|\]$/g, '') ?? '';

    if (isIP(host) !== 0 && !isWebhookAddressAllowed(host, reachesLocalNetwork)) {
      throw new Error(
        say(
          isWebhookAddressAllowed(host, true)
            ? 'error.webhook.valenceWillNotSendToTheLocalNetwork'
            : 'error.common.valenceWillNotSendDeliveriesTo',
        ),
      );
    }

    const agent = new Agent({ connect: { lookup: pinnedWebhookLookup(reachesLocalNetwork) } });

    try {
      const response = await fetch(url, { ...init, redirect: 'manual', dispatcher: agent });

      await response.body?.cancel();

      return { ok: response.ok, status: response.status };
    } finally {
      await agent.close();
    }
  };

export { createPinnedWebhookFetcher };

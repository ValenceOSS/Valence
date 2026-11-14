import { isWebhookAddressAllowed } from './isWebhookAddressAllowed';
import type { StringKey } from '@ValenceI18n/StringKey';

/**
 * Why a webhook may not be sent to a set of addresses: the local network where only the switch
 * keeps it out, and the plain refusal where the address is never allowed.
 *
 * @param addresses - The IP addresses a host is written as or resolves to.
 * @param reachesLocalNetwork - Whether the webhook is allowed to reach the local network.
 * @returns The words of the refusal, or nothing where every address is allowed.
 */
const refusalOfWebhookAddress = (
  addresses: readonly string[],
  reachesLocalNetwork: boolean,
): StringKey | null => {
  if (addresses.every((address) => isWebhookAddressAllowed(address, reachesLocalNetwork))) {
    return null;
  }

  return addresses.some((address) => isWebhookAddressAllowed(address, true))
    ? 'error.webhook.valenceWillNotSendToTheLocalNetwork'
    : 'error.common.valenceWillNotSendDeliveriesTo';
};

export { refusalOfWebhookAddress };

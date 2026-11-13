import { BlockList, isIP } from 'node:net';
import { isPublicAddress } from '@ValenceCore/network/isPublicAddress';

const ALWAYS_REFUSED = new BlockList();

ALWAYS_REFUSED.addSubnet('169.254.0.0', 16, 'ipv4');
ALWAYS_REFUSED.addSubnet('fe80::', 10, 'ipv6');
ALWAYS_REFUSED.addSubnet('fd00:ec2::', 64, 'ipv6');
ALWAYS_REFUSED.addAddress('100.100.100.200', 'ipv4');

const MAPPED_IPV4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

/**
 * Decides whether a delivery may be sent to one resolved address: link-local and cloud metadata
 * addresses never, and the rest of the local network only where the webhook has been allowed to
 * reach it.
 *
 * @param address - An IPv4 or IPv6 address, as a resolver answered it.
 * @param reachesLocalNetwork - Whether the webhook is allowed to reach the local network.
 * @returns Whether the delivery may go there.
 */
const isWebhookAddressAllowed = (address: string, reachesLocalNetwork: boolean): boolean => {
  const mapped = MAPPED_IPV4.exec(address)?.[1];

  if (mapped !== undefined) {
    return isWebhookAddressAllowed(mapped, reachesLocalNetwork);
  }

  const family = isIP(address);

  if (family === 0) {
    return false;
  }

  if (ALWAYS_REFUSED.check(address, family === 4 ? 'ipv4' : 'ipv6')) {
    return false;
  }

  return reachesLocalNetwork || isPublicAddress(address);
};

export { isWebhookAddressAllowed };

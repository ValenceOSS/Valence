import { BlockList, isIP } from 'node:net';

const HOME_NETWORKS = new BlockList();

for (const [address, prefix] of [
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
] as const) {
  HOME_NETWORKS.addSubnet(address, prefix, 'ipv4');
}

HOME_NETWORKS.addSubnet('fc00::', 7, 'ipv6');

const MAPPED_IPV4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

/**
 * Whether an address is on a home or office network: the ranges a router hands out and an IPv6 local
 * address, and not this machine, a link-local or shared-carrier address or a cloud's metadata
 * service.
 *
 * @param address - An IPv4 or IPv6 address, as a resolver answered it.
 * @returns Whether it is on a private network.
 */
const isPrivateNetworkAddress = (address: string): boolean => {
  const mapped = MAPPED_IPV4.exec(address)?.[1];

  if (mapped !== undefined) {
    return isPrivateNetworkAddress(mapped);
  }

  const family = isIP(address);

  return family !== 0 && HOME_NETWORKS.check(address, family === 4 ? 'ipv4' : 'ipv6');
};

export { isPrivateNetworkAddress };

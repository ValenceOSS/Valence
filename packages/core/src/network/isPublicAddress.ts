import { BlockList, isIP } from 'node:net';

const PRIVATE = new BlockList();

for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  PRIVATE.addSubnet(address, prefix, 'ipv4');
}

for (const [address, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  PRIVATE.addSubnet(address, prefix, 'ipv6');
}

const MAPPED_IPV4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

/**
 * Whether an address is somewhere on the public internet, rather than this machine, the network
 * it sits on, a cloud's metadata service or a range kept for documentation — which is the only
 * kind of address a plugin's request may reach, whatever name led to it.
 *
 * @param address - An IPv4 or IPv6 address, as a resolver answered it.
 * @returns Whether it is public.
 */
const isPublicAddress = (address: string): boolean => {
  const mapped = MAPPED_IPV4.exec(address)?.[1];

  if (mapped !== undefined) {
    return isPublicAddress(mapped);
  }

  const family = isIP(address);

  if (family === 0) {
    return false;
  }

  return !PRIVATE.check(address, family === 4 ? 'ipv4' : 'ipv6');
};

export { isPublicAddress };

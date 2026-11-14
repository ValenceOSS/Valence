import { BlockList, isIP } from 'node:net';

const NEVER_REACHED = new BlockList();

NEVER_REACHED.addSubnet('169.254.0.0', 16, 'ipv4');
NEVER_REACHED.addSubnet('fe80::', 10, 'ipv6');
NEVER_REACHED.addSubnet('fd00:ec2::', 64, 'ipv6');

const MAPPED_IPV4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

/**
 * Whether an address is one a cloud keeps its metadata service on, or another link-local one, which
 * no storage service is ever at.
 *
 * @param address - An IPv4 or IPv6 address.
 * @returns Whether it is link-local.
 */
const isLinkLocal = (address: string): boolean => {
  const mapped = MAPPED_IPV4.exec(address)?.[1];

  if (mapped !== undefined) {
    return isLinkLocal(mapped);
  }

  const family = isIP(address);

  return family !== 0 && NEVER_REACHED.check(address, family === 4 ? 'ipv4' : 'ipv6');
};

export { isLinkLocal };

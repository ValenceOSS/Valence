import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

type Resolve = (host: string) => Promise<readonly string[]>;

const NEVER_REACHED = new BlockList();

NEVER_REACHED.addSubnet('169.254.0.0', 16, 'ipv4');
NEVER_REACHED.addSubnet('fe80::', 10, 'ipv6');
NEVER_REACHED.addSubnet('fd00:ec2::', 64, 'ipv6');

const MAPPED_IPV4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

const resolveAll: Resolve = async (host) =>
  (await lookup(host, { all: true, verbatim: true })).map((found) => found.address);

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

/**
 * Whether the address of a storage service is one the server may be pointed at: none, for the
 * provider's own, or an http or https address that does not lead to a link-local address such as a
 * cloud's metadata service. A service on the home network is fine; that is what a self-hosted one
 * is.
 *
 * @param endpoint - The address, as the administrator wrote it.
 * @param resolve - How a name is resolved.
 * @returns Whether it may be used.
 */
const isAcceptableEndpoint = async (
  endpoint: string,
  resolve: Resolve = resolveAll,
): Promise<boolean> => {
  if (endpoint.trim() === '') {
    return true;
  }

  const url = URL.parse(endpoint);

  if (url === null || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    return false;
  }

  const host = url.hostname.replace(/^\[(.*)\]$/u, '$1');
  const found = isIP(host) !== 0 ? [host] : await resolve(host).catch(() => []);

  return !found.some(isLinkLocal);
};

export type { Resolve };

export { isAcceptableEndpoint };

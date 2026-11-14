import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { isPublicAddress } from '@ValenceCore/network/isPublicAddress';
import type { Resolve } from './isPublicWebAddress';

const resolveAll: Resolve = async (host) =>
  (await lookup(host, { all: true, verbatim: true })).map((found) => found.address);

/**
 * Whether a web address positively leads only to this machine or its own network: a private or
 * loopback number, or a name every address of which is one; a name that does not resolve is not.
 *
 * @param address - The address, as a playlist wrote it.
 * @param resolve - How a name is resolved.
 * @returns Whether the address is known to be local.
 */
const isLocalWebAddress = async (
  address: string,
  resolve: Resolve = resolveAll,
): Promise<boolean> => {
  const url = URL.parse(address);

  if (url === null || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    return false;
  }

  const host = url.hostname.replace(/^\[(.*)\]$/u, '$1');

  if (isIP(host) !== 0) {
    return !isPublicAddress(host);
  }

  const found = await resolve(host).catch(() => []);

  return found.length > 0 && found.every((candidate) => !isPublicAddress(candidate));
};

export { isLocalWebAddress };

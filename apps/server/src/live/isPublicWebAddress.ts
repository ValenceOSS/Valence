import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { isPublicAddress } from '@ValenceCore/network/isPublicAddress';

type Resolve = (host: string) => Promise<readonly string[]>;

const resolveAll: Resolve = async (host) =>
  (await lookup(host, { all: true, verbatim: true })).map((found) => found.address);

/**
 * Whether a web address leads only to the public internet: an http or https address whose host is
 * a public number, or a name every address of which is public.
 *
 * @param address - The address, as a playlist wrote it.
 * @param resolve - How a name is resolved.
 * @returns Whether it may be fetched on behalf of a remote playlist.
 */
const isPublicWebAddress = async (
  address: string,
  resolve: Resolve = resolveAll,
): Promise<boolean> => {
  const url = URL.parse(address);

  if (url === null || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    return false;
  }

  const host = url.hostname.replace(/^\[(.*)\]$/u, '$1');

  if (isIP(host) !== 0) {
    return isPublicAddress(host);
  }

  const found = await resolve(host).catch(() => []);

  return found.length > 0 && found.every((candidate) => isPublicAddress(candidate));
};

export type { Resolve };

export { isPublicWebAddress };

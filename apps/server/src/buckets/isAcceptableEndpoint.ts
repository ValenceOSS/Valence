import { isIP } from 'node:net';
import type { Resolve } from '@ValenceServer/live/isPublicWebAddress';
import { isLinkLocal } from '@ValenceServer/buckets/isLinkLocal';
import { resolveAll } from '@ValenceServer/web/resolveAll';

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

export { isAcceptableEndpoint };

import { lookup } from 'node:dns/promises';
import type { Resolve } from '@ValenceServer/live/isPublicWebAddress';

/**
 * Every address a name leads to, as the system's resolver answers them.
 *
 * @param host - The name.
 * @returns Its addresses.
 */
const resolveAll: Resolve = async (host) =>
  (await lookup(host, { all: true, verbatim: true })).map((found) => found.address);

export { resolveAll };

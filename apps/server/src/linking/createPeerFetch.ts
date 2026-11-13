import { isAcceptableEndpoint } from '@ValenceServer/buckets/isAcceptableEndpoint';
import type { Resolve } from '@ValenceServer/buckets/isAcceptableEndpoint';

const REMEMBERED_MS = 60_000;

const MOST_REMEMBERED = 1000;

/**
 * Sends a request to another Valence only where its address is one a server can be at: never a
 * link-local address, where a cloud keeps its machines' secrets, and never somewhere the other
 * server's answer sends it, which is taken as no answer at all. A server on the household network
 * stays reachable, since two servers in one house linking is ordinary. What an address resolves to
 * is remembered for a minute, so a film passed through is not looked up for every piece of it.
 *
 * @param fetcher - How a request is sent.
 * @param resolve - What a name resolves to, injectable for tests.
 * @param now - The clock.
 * @returns How to send a request to another server.
 */
const createPeerFetch = (
  fetcher: typeof fetch,
  resolve?: Resolve,
  now: () => number = Date.now,
): ((address: string, init: RequestInit) => Promise<Response>) => {
  const judged = new Map<string, { isAcceptable: boolean; until: number }>();

  const isAcceptable = async (address: string): Promise<boolean> => {
    const host = URL.parse(address)?.host ?? '';
    const known = judged.get(host);

    if (known !== undefined && known.until > now()) {
      return known.isAcceptable;
    }

    const verdict = host !== '' && (await isAcceptableEndpoint(address, resolve));

    if (judged.size >= MOST_REMEMBERED) {
      judged.clear();
    }

    judged.set(host, { isAcceptable: verdict, until: now() + REMEMBERED_MS });

    return verdict;
  };

  return async (address, init) => {
    if (!(await isAcceptable(address))) {
      throw new Error(`${address} is not an address another server can be at`);
    }

    const response = await fetcher(address, { ...init, redirect: 'manual' });

    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
      throw new Error(`${address} sent this server somewhere else`);
    }

    return response;
  };
};

export { createPeerFetch };

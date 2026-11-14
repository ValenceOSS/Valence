import { isAcceptableEndpoint } from '@ValenceServer/buckets/isAcceptableEndpoint';
import { isLinkLocal } from '@ValenceServer/buckets/isLinkLocal';
import { httpsUpgradeOf } from '@ValenceServer/linking/httpsUpgradeOf';
import { createPinnedFetch } from '@ValenceServer/web/createPinnedFetch';
import type { Resolve } from '@ValenceServer/live/isPublicWebAddress';

type Send = (address: string, init: RequestInit) => Promise<Response>;

const REMEMBERED_MS = 60_000;

const MOST_REMEMBERED = 1000;

/**
 * Sends a request to another Valence only where its address is one a server can be at: never a
 * link-local address, where a cloud keeps its machines' secrets, and never somewhere the other
 * server's answer sends it, which is taken as no answer at all, but for one step from an http address to
 * the same name over https, which is followed. A server on the household network
 * stays reachable, since two servers in one house linking is ordinary. What an address resolves to
 * is remembered for a minute, so a film passed through is not looked up for every piece of it. A
 * request is connected only to an address that passed, chosen when connecting and not looked up
 * again afterwards, so a name that changes in between gains nothing; its answer is handed on as a
 * stream, not held.
 *
 * @param fetcher - How a request is sent, by default connecting only to addresses that are not
 * link-local.
 * @param resolve - What a name resolves to, injectable for tests.
 * @param now - The clock.
 * @returns How to send a request to another server.
 */
const createPeerFetch = (
  fetcher?: typeof fetch,
  resolve?: Resolve,
  now: () => number = Date.now,
): ((address: string, init: RequestInit) => Promise<Response>) => {
  const pinned = createPinnedFetch(
    (address) => !isLinkLocal(address),
    (addresses) => new Error(`${addresses.join(', ')} is not an address another server can be at`),
    resolve,
  );
  const send: Send =
    fetcher ??
    ((address, init) =>
      pinned(address, {
        headers: Object.fromEntries(new Headers(init.headers)),
        ...(init.method === undefined ? {} : { method: init.method }),
        ...(init.signal === null || init.signal === undefined ? {} : { signal: init.signal }),
        ...(typeof init.body === 'string' || init.body instanceof ArrayBuffer
          ? { body: init.body }
          : {}),
        redirect: 'manual',
      }));
  const judged = new Map<string, { isAcceptable: boolean; until: number }>();

  const isAcceptable = async (address: string): Promise<boolean> => {
    const origin = URL.parse(address)?.origin ?? '';
    const known = judged.get(origin);

    if (known !== undefined && known.until > now()) {
      return known.isAcceptable;
    }

    const verdict = origin !== '' && (await isAcceptableEndpoint(address, resolve));

    if (judged.size >= MOST_REMEMBERED) {
      judged.clear();
    }

    judged.set(origin, { isAcceptable: verdict, until: now() + REMEMBERED_MS });

    return verdict;
  };

  const isARedirect = (response: Response): boolean =>
    response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400);

  return async (address, init) => {
    if (!(await isAcceptable(address))) {
      throw new Error(`${address} is not an address another server can be at`);
    }

    const response = await send(address, { ...init, redirect: 'manual' });

    if (!isARedirect(response)) {
      return response;
    }

    const upgrade = httpsUpgradeOf(address, response.headers.get('location'));

    await response.body?.cancel();

    if (upgrade === null || !(await isAcceptable(upgrade))) {
      throw new Error(`${address} sent this server somewhere else`);
    }

    const upgraded = await send(upgrade, { ...init, redirect: 'manual' });

    if (isARedirect(upgraded)) {
      await upgraded.body?.cancel();

      throw new Error(`${upgrade} sent this server somewhere else`);
    }

    return upgraded;
  };
};

export { createPeerFetch };

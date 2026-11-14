import { FINAL_ADDRESS } from './FINAL_ADDRESS';
import { isPublicWebAddress } from './isPublicWebAddress';
import type { Resolve } from './isPublicWebAddress';

const MOST_HOPS = 5;

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

/**
 * Wraps a fetch so it only ever reaches the public internet: the address is checked before each
 * request, every redirect is followed by hand and checked again, and where the wrapped fetch
 * reports the address a response finally came from, that is checked too. Used wherever a remote
 * playlist names an address and the answer is handed back to a viewer.
 *
 * @param inner - The fetch to wrap.
 * @param resolve - How a name is resolved, for a test.
 * @returns A fetch that throws rather than reach a private address.
 */
const createPublicOnlyFetch =
  (inner: typeof fetch, resolve?: Resolve): typeof fetch =>
  async (input, init) => {
    let address = input instanceof Request ? input.url : input.toString();

    for (let hop = 0; hop <= MOST_HOPS; hop += 1) {
      if (!(await isPublicWebAddress(address, resolve))) {
        throw new TypeError('that address is not on the public internet');
      }

      const response = await inner(address, { ...init, redirect: 'manual' });
      const location = response.headers.get('location');

      if (REDIRECTS.has(response.status) && location !== null) {
        void response.body?.cancel();
        address = new URL(location, address).toString();

        continue;
      }

      const final = response.headers.get(FINAL_ADDRESS);

      if (final !== null && !(await isPublicWebAddress(final, resolve))) {
        void response.body?.cancel();

        throw new TypeError('that address is not on the public internet');
      }

      return response;
    }

    throw new TypeError('too many redirects');
  };

export { createPublicOnlyFetch };

import { theServerThisPhoneWatches } from '@ValencePhone/platform/theServerThisPhoneWatches';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

/**
 * Teaches this phone to ask its Valence the way a page served by it would: resolving a path against
 * it, and saying where the request came from.
 *
 * The application asks for `/api/profiles/everyone` and expects the client it is running in to know
 * where that is. A browser does, because the page came from the server. A phone was not served by
 * anything, has no origin at all, and so fails before the request leaves. Done once here rather than
 * at each of the thirty-eight places that ask, because what they are asking for is not wrong and a
 * thirty-ninth is one feature away.
 *
 * Saying where it came from is the other half, and without it signing out fails silently — which is
 * the same fault the desktop client had, and is recorded in `trustedOriginsFor` as leaving somebody
 * signed in on a machine they had walked away from. Anything that ends or changes a session is
 * refused outright without an origin the server trusts, and a phone writes none.
 *
 * It says the request comes from the server it is going to, because out here it does: the phone is
 * asking that Valence directly and the server trusts the addresses it answers on. Nothing is given
 * away by saying so — what an origin protects against is a page somewhere else acting in somebody's
 * name, and there is no somewhere else. Only requests aimed at that server are told this, so
 * artwork or anything else fetched elsewhere is left exactly as it was.
 *
 * @param store - Where the phone keeps which server it watches.
 */
const giveThisPhoneAnOrigin = (store: DeviceStore): void => {
  const asked = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input, init) => {
    const address = theServerThisPhoneWatches(store);

    if (address === null) {
      return asked(input, init);
    }

    if (input instanceof Request) {
      if (input.url.startsWith(address)) {
        input.headers.set('origin', address);
      }

      return asked(input, init);
    }

    const wanted = String(input);
    const whole = wanted.startsWith('/') ? new URL(wanted, address).toString() : wanted;

    if (!whole.startsWith(address)) {
      return asked(input, init);
    }

    const headers = new Headers(init?.headers);

    headers.set('origin', address);

    return asked(whole, { ...init, headers });
  };
};

export { giveThisPhoneAnOrigin };

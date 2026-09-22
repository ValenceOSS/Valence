import { theServerThisPhoneWatches } from '@ValencePhone/platform/theServerThisPhoneWatches';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

/**
 * Teaches this phone to resolve a path the way a page would, against the server it was told to
 * watch.
 *
 * The application asks for `/api/profiles/everyone` and expects the client it is running in to
 * know where that is. A browser does: the page came from the server, so a relative path resolves
 * against it. A phone was not served by anything and has no origin at all, so the same request
 * fails before it is sent.
 *
 * Done once here rather than at each of the places that ask, because there are thirty-eight of
 * them and a thirty-ninth is one feature away. What they are asking for is not wrong — a path on
 * this Valence is exactly what they mean — so the honest fix is to make that mean something here,
 * which is what a host is for. A whole address is left alone, so artwork and streams aimed
 * elsewhere still go where they were aimed.
 *
 * @param store - Where the phone keeps which server it watches.
 */
const giveThisPhoneAnOrigin = (store: DeviceStore): void => {
  const asked = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input, init) => {
    const address = theServerThisPhoneWatches(store);

    if (address === null || typeof input !== 'string' || !input.startsWith('/')) {
      return asked(input, init);
    }

    return asked(new URL(input, address).toString(), init);
  };
};

export { giveThisPhoneAnOrigin };

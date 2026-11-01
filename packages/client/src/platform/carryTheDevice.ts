import { z } from 'zod';
import { DEVICE_HEADER } from '@ValenceContracts/constants/DEVICE_HEADER';
import { writeDeviceHints } from '@ValenceContracts/functions/writeDeviceHints';
import { theDeviceHints } from '@ValenceClient/platform/theDeviceHints';

type Page = { fetch: typeof fetch };

const LocationSchema = z.object({ origin: z.string() });

/**
 * Puts a shim in front of a page's `fetch` that tells the server which device each of its own
 * requests comes from, so that signing in, choosing a profile and pressing play are each described
 * by the device rather than by a user agent alone. A request for anywhere else goes as it was made,
 * carrying nothing about this device.
 *
 * @param page - The page whose requests to mark, this one unless a test says otherwise.
 */
const carryTheDevice = (page: Page = globalThis): void => {
  const asked = page.fetch.bind(page);
  const here = LocationSchema.safeParse(Reflect.get(page, 'location'));
  const isOurs = (address: string): boolean =>
    address.startsWith('/') || (here.success && address.startsWith(`${here.data.origin}/`));

  page.fetch = (input, init) => {
    const address = input instanceof Request ? input.url : String(input);

    if (!isOurs(address)) {
      return asked(input, init);
    }

    const said = writeDeviceHints(theDeviceHints());

    if (input instanceof Request) {
      input.headers.set(DEVICE_HEADER, said);

      return asked(input, init);
    }

    const headers = new Headers(init?.headers);

    headers.set(DEVICE_HEADER, said);

    return asked(input, { ...init, headers });
  };
};

export { carryTheDevice };

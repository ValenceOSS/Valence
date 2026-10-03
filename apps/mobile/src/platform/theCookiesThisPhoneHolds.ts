import { requireOptionalNativeModule } from 'expo';

type Cookies = {
  cookieHeaderFor?: (address: string) => Promise<string | null>;
};

/**
 * What this phone would send to a server, as one header.
 *
 * Everything that asks over `fetch` or draws an image gets these attached for it, because both go
 * through the system's own networking and the system keeps the jar. The player does not: an
 * `AVURLAsset` is built without being told to consult it, so a film is asked for with no session
 * and the server answers that nobody is signed in. Reading the jar and handing it over is the
 * whole of the fix.
 *
 * @param address - The server being asked.
 * @returns What to send as `Cookie`, or nothing where this phone holds none for it.
 */
const theCookiesThisPhoneHolds = async (address: string): Promise<string | null> => {
  const jar = requireOptionalNativeModule<Cookies>('ValenceCookies');

  if (jar?.cookieHeaderFor === undefined) {
    return null;
  }

  const held = await jar.cookieHeaderFor(address).catch(() => null);

  return held === null || held === '' ? null : held;
};

export { theCookiesThisPhoneHolds };

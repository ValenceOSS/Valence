import { Skia } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';

const READ = new Map<string, Promise<SkImage | null>>();

const KEPT = 3;

/**
 * Reads a picture for Skia to draw, once however many places draw it: one from the server with the
 * phone's cookies sent by hand, as every picture fetched from it is, and one on the phone straight
 * from where it lies. Only the last few read are kept, since a photograph straight from the camera
 * takes tens of megabytes once decoded. Gives nothing where it cannot be had or read.
 *
 * @param uri - Where the picture is.
 * @returns The picture, decoded.
 */
const readSkiaPicture = (uri: string): Promise<SkImage | null> => {
  const known = READ.get(uri);

  if (known !== undefined) {
    READ.delete(uri);
    READ.set(uri, known);

    return known;
  }

  const reading = (async () => {
    if (!/^https?:/u.test(uri)) {
      return Skia.Image.MakeImageFromEncoded(await Skia.Data.fromURI(uri));
    }

    const cookie = await theCookiesThisPhoneHolds(uri);
    const response = await fetch(uri, cookie === null ? {} : { headers: { Cookie: cookie } });

    if (!response.ok) {
      return null;
    }

    return Skia.Image.MakeImageFromEncoded(
      Skia.Data.fromBytes(new Uint8Array(await response.arrayBuffer())),
    );
  })().catch(() => null);

  READ.set(uri, reading);

  for (const oldest of [...READ.keys()].slice(0, Math.max(READ.size - KEPT, 0))) {
    READ.delete(oldest);
  }
  void reading.then((read) => {
    if (read === null) {
      READ.delete(uri);
    }
  });

  return reading;
};

export { readSkiaPicture };

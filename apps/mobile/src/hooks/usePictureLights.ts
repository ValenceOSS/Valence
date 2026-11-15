import { useEffect, useState } from 'react';
import { AlphaType, ColorType, FilterMode, MipmapMode, Skia } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import { lightsOfPixels, READ_AT } from '@ValenceCore/pictures/lightsOfPixels';
import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';
import { readSkiaPicture } from '@ValenceMobile/pictures/readSkiaPicture';
import type { ALight } from '@ValenceMobile/components/AMoodBackground/AMoodBackground.types';

const read = new Map<string, Promise<ALight[]>>();

const lightsRead = new Map<string, ALight[]>();

/**
 * Reads a picture into lights the way the web reads one: drawn into a small square, which averages
 * it, and that square's pixels read once. A picture is only decoded as it is drawn, and that is
 * done here, in the middle of the app's own work, so one wider or taller than the largest copy the
 * server ever narrows a picture to — a photo straight from the camera, or a whole cover from a
 * server too old to narrow it — is not read at all; its size is known from its header without
 * decoding it.
 *
 * @param picture - The picture, not yet decoded.
 * @returns Its lights, or none where it is too large to read or could not be drawn small.
 */
const lightsOfPicture = (picture: SkImage): ALight[] => {
  try {
    if (Math.max(picture.width(), picture.height()) > ARTWORK_WIDTHS.large) {
      return [];
    }

    const surface = Skia.Surface.Make(READ_AT, READ_AT);

    if (surface === null) {
      return [];
    }

    surface
      .getCanvas()
      .drawImageRectOptions(
        picture,
        Skia.XYWHRect(0, 0, picture.width(), picture.height()),
        Skia.XYWHRect(0, 0, READ_AT, READ_AT),
        FilterMode.Linear,
        MipmapMode.Linear,
      );
    surface.flush();

    const pixels = surface.makeImageSnapshot().readPixels(0, 0, {
      width: READ_AT,
      height: READ_AT,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    });

    return pixels === null
      ? []
      : lightsOfPixels(pixels, READ_AT).map((light) => ({
          colour: light.color,
          at: light.at,
          weight: light.weight,
        }));
  } catch {
    return [];
  }
};

/**
 * Reads a picture into lights, once, and remembers them.
 *
 * @param url - The picture, on this phone's server.
 * @returns Its lights, or none where they could not be read.
 */
const lightsOf = (url: string): Promise<ALight[]> => {
  const known = read.get(url);

  if (known !== undefined) {
    return known;
  }

  const reading = readSkiaPicture(url).then((picture) => {
    const found = picture === null ? [] : lightsOfPicture(picture);

    lightsRead.set(url, found);

    return found;
  });

  read.set(url, reading);

  return reading;
};

/**
 * The colours of a picture, as lights for whatever is drawn behind it — a film's backdrop behind the
 * library, an album's cover behind the player — read by the same sums as the web's, so a title
 * lights the phone as it lights the browser. Only a few dozen pixels of it are read, so whoever asks
 * gives the smallest copy the server makes rather than the one they draw, and a picture too large to
 * decode quickly lights nothing.
 *
 * The lights already showing are kept until the next picture's have been read, so the page never
 * drops back to its own colours between two pictures, and a picture read once is not read again —
 * its lights are there from the first draw, so something that reads a picture ahead of showing it
 * opens already lit.
 *
 * @param url - The picture, or nothing for no lights.
 * @returns The lights.
 */
const usePictureLights = (url: string | null): ALight[] => {
  const [lights, setLights] = useState<ALight[]>(() =>
    url === null ? [] : (lightsRead.get(url) ?? []),
  );

  useEffect(() => {
    if (url === null) {
      setLights([]);

      return undefined;
    }

    let isGone = false;

    void lightsOf(url).then((found) => {
      if (!isGone && found.length > 0) {
        setLights(found);
      }
    });

    return () => {
      isGone = true;
    };
  }, [url]);

  return lights;
};

export { usePictureLights };

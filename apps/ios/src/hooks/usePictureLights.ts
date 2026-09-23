import { useEffect, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';
import { z } from 'zod';
import { theCookiesThisPhoneHolds } from '@ValencePhone/platform/theCookiesThisPhoneHolds';
import type { ALight } from '@ValencePhone/components/AMoodBackground/AMoodBackground.types';

type Lights = {
  readLights: (url: string, cookie: string | null) => Promise<object[]>;
};

const LightsSchema = z.array(z.object({ colour: z.string(), at: z.string() }));

const read = new Map<string, Promise<ALight[]>>();

const lightsRead = new Map<string, ALight[]>();

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

  const reader = requireOptionalNativeModule<Lights>('ValenceLights');
  const reading =
    reader === null
      ? Promise.resolve([])
      : theCookiesThisPhoneHolds(url)
          .then(async (cookie) => reader.readLights(url, cookie))
          .then((said) => {
            const parsed = LightsSchema.safeParse(said);

            const found = parsed.success ? parsed.data : [];

            lightsRead.set(url, found);

            return found;
          })
          .catch(() => []);

  read.set(url, reading);

  return reading;
};

/**
 * The colours of a picture, as lights for whatever is drawn behind it — a film's backdrop behind the
 * library, an album's cover behind the player.
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

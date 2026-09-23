import { useEffect, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';
import { z } from 'zod';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValencePhone/platform/theCookiesThisPhoneHolds';
import type { ALight } from '@ValencePhone/components/AMoodBackground/AMoodBackground.types';

type Lights = {
  readLights: (url: string, cookie: string | null) => Promise<object[]>;
};

const LightsSchema = z.array(z.object({ colour: z.string(), at: z.string() }));

const read = new Map<string, Promise<ALight[]>>();

/**
 * Reads a title's backdrop into lights, once, and remembers them.
 *
 * @param mediaId - The title.
 * @returns Its lights, or none where they could not be read.
 */
const lightsOf = (mediaId: string): Promise<ALight[]> => {
  const known = read.get(mediaId);

  if (known !== undefined) {
    return known;
  }

  const reader = requireOptionalNativeModule<Lights>('ValenceLights');
  const url = onThisServer(`/api/media/${mediaId}/image/backdrop`);
  const reading =
    reader === null
      ? Promise.resolve([])
      : theCookiesThisPhoneHolds(url)
          .then(async (cookie) => reader.readLights(url, cookie))
          .then((said) => {
            const parsed = LightsSchema.safeParse(said);

            return parsed.success ? parsed.data : [];
          })
          .catch(() => []);

  read.set(mediaId, reading);

  return reading;
};

/**
 * The colours of a title's artwork, as lights for the page behind it, as the web lights its home
 * page with whatever its hero is showing.
 *
 * The lights already showing are kept until the next title's have been read, so the page never
 * drops back to its own colours between two titles, and a title read once is not read again.
 *
 * @param mediaId - Whose artwork, or nothing for no lights.
 * @returns The lights.
 */
const useArtworkLights = (mediaId: string | null): ALight[] => {
  const [lights, setLights] = useState<ALight[]>([]);

  useEffect(() => {
    if (mediaId === null) {
      setLights([]);

      return undefined;
    }

    let isGone = false;

    void lightsOf(mediaId).then((found) => {
      if (!isGone && found.length > 0) {
        setLights(found);
      }
    });

    return () => {
      isGone = true;
    };
  }, [mediaId]);

  return lights;
};

export { useArtworkLights };

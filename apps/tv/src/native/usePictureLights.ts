import { useEffect, useRef, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';
import { z } from 'zod';
import type { PictureLight } from '@ValenceTv/native/PictureLight';

type Lights = {
  readLights: (url: string, headers: Record<string, string>) => Promise<object[]>;
};

const LightsSchema = z.array(z.object({ colour: z.string().min(1), at: z.string().min(1) }));

const read = new Map<string, Promise<PictureLight[]>>();

/**
 * The lights a picture gives, read once for each picture and kept, or none where this television
 * cannot read them.
 *
 * @param url - The picture.
 * @param headers - What to sign the request for it with.
 * @returns The lights, once read.
 */
const lightsOf = (url: string, headers: Record<string, string>): Promise<PictureLight[]> => {
  const known = read.get(url);

  if (known !== undefined) {
    return known;
  }

  const reader = requireOptionalNativeModule<Lights>('ValenceLights');
  const reading =
    reader === null
      ? Promise.resolve([])
      : reader
          .readLights(url, headers)
          .then((said) => {
            const parsed = LightsSchema.safeParse(said);

            return parsed.success ? parsed.data : [];
          })
          .catch(() => []);

  read.set(url, reading);

  return reading;
};

/**
 * The colours of a picture laid out where on the page they belong, for a page to be lit with them
 * on Android, whose blur cannot soften a picture into a wash. Nothing until they have been read, and
 * nothing where there is no picture or it cannot be read.
 *
 * @param url - The picture, or nothing.
 * @param headers - What to sign the request for it with.
 * @returns The lights.
 */
const usePictureLights = (url: string | null, headers: Record<string, string>): PictureLight[] => {
  const [lights, setLights] = useState<{ url: string; lights: PictureLight[] } | null>(null);
  const signedWith = useRef(headers);

  useEffect(() => {
    signedWith.current = headers;
  });

  useEffect(() => {
    if (url === null) {
      return undefined;
    }

    let isGone = false;

    void lightsOf(url, signedWith.current).then((found) => {
      if (!isGone) {
        setLights({ url, lights: found });
      }
    });

    return () => {
      isGone = true;
    };
  }, [url]);

  return lights !== null && lights.url === url ? lights.lights : [];
};

export { usePictureLights };

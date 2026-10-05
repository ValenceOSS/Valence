import { useEffect, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';
import { z } from 'zod';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';

type EdgeReader = {
  readEdge?: (url: string, cookie: string | null) => Promise<string | null>;
};

const ColourSchema = z
  .string()
  .regex(/^#[0-9a-f]{6}$/u)
  .nullable()
  .catch(null);

const read = new Map<string, Promise<string | null>>();

/**
 * Reads the colour round the edge of a page's picture, once, and remembers it.
 *
 * @param url - The page's picture, on this phone's server.
 * @returns Its colour as `#rrggbb`, or nothing where it could not be read.
 */
const paperOf = (url: string): Promise<string | null> => {
  const known = read.get(url);

  if (known !== undefined) {
    return known;
  }

  const reader = requireOptionalNativeModule<EdgeReader>('ValenceLights');
  const readEdge = reader?.readEdge;
  const reading =
    readEdge === undefined
      ? Promise.resolve(null)
      : theCookiesThisPhoneHolds(url)
          .then((cookie) => readEdge(url, cookie))
          .then((colour) => ColourSchema.parse(colour))
          .catch(() => null);

  read.set(url, reading);

  return reading;
};

/**
 * The colour of the paper a page is printed on, read from the edge of its picture, so the room
 * round a page that does not fill the screen reads as more of the page.
 *
 * @param url - The page's picture, or nothing where no page is showing.
 * @returns Its colour as `#rrggbb`, or nothing until it is known or where it cannot be.
 */
const usePaperOf = (url: string | null): string | null => {
  const [paper, setPaper] = useState<{ url: string; colour: string | null } | null>(null);

  useEffect(() => {
    if (url === null) {
      return undefined;
    }

    let isGone = false;

    void paperOf(url).then((colour) => {
      if (!isGone) {
        setPaper({ url, colour });
      }
    });

    return () => {
      isGone = true;
    };
  }, [url]);

  return paper?.url === url ? paper.colour : null;
};

export { usePaperOf };

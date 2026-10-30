import { averageColourOf } from '@ValenceCore/functions/averageColourOf';
import { deepTintOf } from '@ValenceCore/functions/deepTintOf';
import type { readPictureTint as onTheTelevision } from '@ValenceTv/platform/readPictureTint';

const ACROSS = 8;

const LIBRARY_PICTURE = /^\/api\/media\/[^/]+\/image\/(?:backdrop|poster)$/u;

/**
 * Asks for the small copy of one of the library's own pictures, since only its colour is wanted.
 *
 * @param path - The picture.
 * @param page - The page it is read for, whose address it is relative to.
 * @returns Where to read it from.
 */
const smallCopyOf = (path: string, page: Document): string => {
  const address = new URL(path, page.baseURI);

  if (address.origin === new URL(page.baseURI).origin && LIBRARY_PICTURE.test(address.pathname)) {
    address.searchParams.set('size', 'small');
  }

  return address.toString();
};

/**
 * Reads the colour a picture tints a television's browser's ground with: the picture drawn eight
 * pixels across, its colours averaged and deepened into a ground to write on, as a phone's card
 * takes its tint. Drawing so small costs a browser next to nothing, where blurring the picture
 * across the screen cost it the most of anything. A picture from another server cannot be read by
 * the page, and one that will not load has no colour, so both leave the plain ground.
 *
 * @param path - The picture.
 * @param page - The page it is read for, the document's own unless a test says otherwise.
 * @returns The tint as `rgb(…)`, or nothing where it could not be read.
 */
const readPictureTint: typeof onTheTelevision = (
  path: string,
  page: Document = document,
): Promise<string | null> =>
  new Promise((resolve) => {
    const picture = page.createElement('img');

    picture.addEventListener('load', () => {
      const canvas = page.createElement('canvas');

      canvas.width = ACROSS;
      canvas.height = ACROSS;

      const pen = canvas.getContext('2d');

      if (pen === null) {
        resolve(null);

        return;
      }

      try {
        pen.drawImage(picture, 0, 0, ACROSS, ACROSS);

        const colour = averageColourOf(pen.getImageData(0, 0, ACROSS, ACROSS).data);

        resolve(colour === null ? null : deepTintOf(colour));
      } catch {
        resolve(null);
      }
    });
    picture.addEventListener('error', () => {
      resolve(null);
    });
    picture.src = smallCopyOf(path, page);
  });

export { readPictureTint };

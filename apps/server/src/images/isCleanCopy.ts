import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

/**
 * Whether a copy the image cache keeps is one cleaned before it was kept: a WebP carrying nothing
 * about the camera, the time or the place.
 *
 * @param path - Where the copy is.
 * @returns Whether it is clean, or nothing where there is no copy.
 */
const isCleanCopy = async (path: string): Promise<boolean | null> => {
  const type = await readFile(`${path}.type`, 'utf8').catch(() => null);

  if (type === null) {
    return null;
  }

  if (type !== 'image/webp') {
    return false;
  }

  const measured = await sharp(path)
    .metadata()
    .catch(() => null);

  return (
    measured !== null &&
    measured.exif === undefined &&
    measured.xmp === undefined &&
    measured.iptc === undefined
  );
};

export { isCleanCopy };

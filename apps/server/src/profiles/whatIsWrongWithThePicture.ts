import sharp from 'sharp';

const ACCEPTED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
};

const MOST_BYTES = 6 * 1024 * 1024;

const MOST_PIXELS_AN_EDGE = 4096;

type PictureFault = 'notAPicture' | 'tooLarge' | 'tooDetailed' | 'unreadable' | 'notYours';

/**
 * The file extension a picture of a given kind is kept under.
 *
 * @param contentType - What the upload said it was.
 * @returns The extension, or nothing for a kind that is not taken.
 */
const extensionFor = (contentType: string): string | undefined => ACCEPTED[contentType];

/**
 * Says why a picture cannot be somebody's face, so that being turned away says which thing was
 * wrong rather than that something was.
 *
 * Three refusals, and they are not the same problem: a file that is not a picture at all, one too
 * many bytes to keep, and one with more detail in it than anything will ever draw. A face is shown
 * at about a hundred pixels, so an edge beyond four thousand is a photograph nobody has cropped
 * rather than a picture anybody will see the benefit of.
 *
 * The bytes are read rather than trusted. A file that says it is a PNG and is not would otherwise be
 * stored, served, and drawn as a broken image — which is the fault this is here to stop, not cause.
 *
 * @param photo - What arrived, and what it claims to be.
 * @returns What is wrong with it, or nothing where it is fine.
 */
const whatIsWrongWithThePicture = async (photo: {
  body: Uint8Array;
  contentType: string;
}): Promise<PictureFault | null> => {
  if (extensionFor(photo.contentType) === undefined) {
    return 'notAPicture';
  }

  if (photo.body.byteLength > MOST_BYTES) {
    return 'tooLarge';
  }

  const measured = await sharp(photo.body)
    .metadata()
    .catch(() => null);

  if (measured === null) {
    return 'unreadable';
  }

  const { width, height } = measured;

  return width > MOST_PIXELS_AN_EDGE || height > MOST_PIXELS_AN_EDGE ? 'tooDetailed' : null;
};

export type { PictureFault };

export { ACCEPTED, MOST_BYTES, MOST_PIXELS_AN_EDGE, extensionFor, whatIsWrongWithThePicture };

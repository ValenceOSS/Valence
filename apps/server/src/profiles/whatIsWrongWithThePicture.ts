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

type PictureLimits = {
  mostBytes: number;
  mostPixelsAnEdge: number;
};

const FACE_LIMITS: PictureLimits = { mostBytes: MOST_BYTES, mostPixelsAnEdge: MOST_PIXELS_AN_EDGE };

/**
 * The file extension a picture of a given kind is kept under.
 *
 * @param contentType - What the upload said it was.
 * @returns The extension, or nothing for a kind that is not taken.
 */
const extensionFor = (contentType: string): string | undefined => ACCEPTED[contentType];

/**
 * The kind of picture a file kept under a given extension is, read back from the same table the
 * extension was chosen from.
 *
 * @param extension - The extension, dot and all.
 * @returns The content type, or nothing for an extension no picture is kept under.
 */
const contentTypeFor = (extension: string): string | undefined =>
  Object.entries(ACCEPTED).find(([, kept]) => kept === extension)?.[0];

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
 * @param limits - How large it may be, which is a face's by default; a picture drawn full-bleed
 *   earns more detail than one drawn at a hundred pixels.
 * @returns What is wrong with it, or nothing where it is fine.
 */
const whatIsWrongWithThePicture = async (
  photo: {
    body: Uint8Array;
    contentType: string;
  },
  limits: PictureLimits = FACE_LIMITS,
): Promise<PictureFault | null> => {
  if (extensionFor(photo.contentType) === undefined) {
    return 'notAPicture';
  }

  if (photo.body.byteLength > limits.mostBytes) {
    return 'tooLarge';
  }

  const measured = await sharp(photo.body)
    .metadata()
    .catch(() => null);

  if (measured === null) {
    return 'unreadable';
  }

  const { width, height } = measured;

  return width > limits.mostPixelsAnEdge || height > limits.mostPixelsAnEdge ? 'tooDetailed' : null;
};

export type { PictureFault, PictureLimits };

export {
  MOST_BYTES,
  MOST_PIXELS_AN_EDGE,
  FACE_LIMITS,
  extensionFor,
  contentTypeFor,
  whatIsWrongWithThePicture,
};

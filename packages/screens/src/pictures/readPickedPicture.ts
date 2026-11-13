import { say } from '@ValenceI18n/say';

const ACCEPTED: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const EDITING_EDGE = 1600;

const EDITING_QUALITY = 0.9;

/**
 * Checks a picture somebody chose against what the server will keep, before it is placed, and makes
 * the copy it is placed with: the picture itself where it is small enough to draw many times over,
 * or else a smaller copy, so moving and drawing it stays smooth however large the upload. A GIF is
 * placed as it is, to keep moving, as is any picture where the browser cannot measure one; the server
 * checks it again either way. What is sent is always the picture chosen, never the copy.
 *
 * @param file - The picture chosen.
 * @param limits - How large a picture of this kind may be.
 * @returns Why it will not be kept, or the picture and the copy to place it with.
 */
const readPickedPicture = async (
  file: File,
  limits: { mostBytes: number; mostPixelsAnEdge: number },
): Promise<{ refusal: string } | { picture: File; preview: File }> => {
  if (!ACCEPTED.has(file.type)) {
    return { refusal: say('server.profiles.describePictureFault.aPictureHasToBeA') };
  }

  if (file.size > limits.mostBytes) {
    return {
      refusal: say('server.profiles.describePictureFault.aPictureHasToBeMegabytes', {
        megabytes: (limits.mostBytes / (1024 * 1024)).toString(),
      }),
    };
  }

  if (typeof createImageBitmap === 'undefined') {
    return { picture: file, preview: file };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);

  if (bitmap === null) {
    return { refusal: say('server.profiles.describePictureFault.thatFileCouldNotBeRead') };
  }

  const { width, height } = bitmap;
  const longest = Math.max(width, height);

  if (longest > limits.mostPixelsAnEdge) {
    bitmap.close();

    return {
      refusal: say('server.profiles.describePictureFault.aPictureHasToBeEdge', {
        edge: limits.mostPixelsAnEdge.toString(),
      }),
    };
  }

  if (file.type === 'image/gif' || longest <= EDITING_EDGE) {
    bitmap.close();

    return { picture: file, preview: file };
  }

  const scale = EDITING_EDGE / longest;
  const canvas = document.createElement('canvas');

  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const smaller = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', EDITING_QUALITY);
  });

  return {
    picture: file,
    preview: smaller === null ? file : new File([smaller], file.name, { type: smaller.type }),
  };
};

export { readPickedPicture };

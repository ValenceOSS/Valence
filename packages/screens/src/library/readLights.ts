import type { MoodLight } from '@ValenceUI/MoodBackground.types';
import { lightsOfPixels, READ_AT } from '@ValenceCore/pictures/lightsOfPixels';

/**
 * Reads the colours that stand for an image, by drawing it very small and reading what is left the
 * way the phone reads it too — one light for each cell of a grid six across and four down. The
 * small picture is read back once and cut into the cells afterwards, since every read back from the
 * canvas waits on the drawing behind it. Shrinking averages the picture for us, which is both
 * cheaper and steadier than sampling a full-size one. Answers with nothing where the image cannot
 * be read at all, which a canvas tainted by another origin cannot.
 *
 * @param source - The image to read.
 * @returns The colours to light a page with, or none where it could not be read.
 */
const readLights = (source: CanvasImageSource): MoodLight[] => {
  try {
    const canvas = document.createElement('canvas');

    canvas.width = READ_AT;
    canvas.height = READ_AT;

    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context === null) {
      return [];
    }

    context.drawImage(source, 0, 0, READ_AT, READ_AT);

    return lightsOfPixels(context.getImageData(0, 0, READ_AT, READ_AT).data, READ_AT);
  } catch {
    return [];
  }
};

export { readLights };

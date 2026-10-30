const SAMPLE_WIDTH = 32;

const SAMPLE_HEIGHT = 18;

/**
 * Draws a picture very small onto a canvas of its own and reads back its pixels.
 *
 * @param source - The picture, which must come from this site or the canvas cannot be read.
 * @returns Its pixels at 32 by 18, four values each, or null where there is no canvas to draw on
 *   or the picture cannot be read.
 */
const samplePixels = (source: CanvasImageSource): Uint8ClampedArray | null => {
  const canvas = document.createElement('canvas');

  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;

  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (context === null) {
    return null;
  }

  try {
    context.drawImage(source, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);

    return context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
  } catch (error) {
    if (error instanceof DOMException) {
      return null;
    }

    throw error;
  }
};

export { samplePixels };

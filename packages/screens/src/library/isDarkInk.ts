const READ_AT = 32;

const DARK_BELOW = 0.4;

const DRAWN_FROM = 128;

/**
 * Says whether the marks in an image are dark — whether, laid over a dark picture, they would all
 * but disappear. Only what is drawn is counted: the transparent ground around a title's lettering
 * says nothing about the lettering. Answers no where the image cannot be read, which leaves it drawn
 * as it is rather than guessed at.
 *
 * Read by the brightest of the three channels rather than by perceptual luminance. Luminance is the
 * right question for reading text, where a mid grey and a saturated red can be equally hard to make
 * out — but wrong for this one, where a logo lettered in a saturated red or blue reads as "dark" by
 * luminance alone (red in particular weighs little in it) despite standing out clearly against black
 * by its colour. What decides whether ink disappears against black is how bright its brightest
 * channel runs, not how the eye weighs the three together.
 *
 * A severe downscale (a full-size poster logo read into a 32 pixel square) is asked to average
 * every source pixel rather than alias a sparse sample of them, since a thin dark outline sampled
 * sparsely can read as darker than the lettering it outlines actually is.
 *
 * @param source - The image, already loaded.
 * @returns Whether its drawn parts are dark.
 */
const isDarkInk = (source: CanvasImageSource): boolean => {
  try {
    const canvas = document.createElement('canvas');

    canvas.width = READ_AT;
    canvas.height = READ_AT;

    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context === null) {
      return false;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, READ_AT, READ_AT);

    const pixels = context.getImageData(0, 0, READ_AT, READ_AT).data;

    let brightness = 0;
    let drawn = 0;

    for (let at = 0; at < pixels.length; at += 4) {
      if ((pixels[at + 3] ?? 0) < DRAWN_FROM) {
        continue;
      }

      brightness += Math.max(pixels[at] ?? 0, pixels[at + 1] ?? 0, pixels[at + 2] ?? 0) / 255;
      drawn += 1;
    }

    return drawn > 0 && brightness / drawn < DARK_BELOW;
  } catch {
    return false;
  }
};

export { isDarkInk };

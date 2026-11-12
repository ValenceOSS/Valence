import type { MoodLight } from '@ValenceUI/MoodBackground.types';
import { READ_AT, readLights } from '@ValenceScreens/library/readLights';

/**
 * Reads the lights in a picture or a playing video without holding up the page: the browser shrinks
 * the frame to the few pixels that are read before any of it leaves the graphics card, and does so
 * in the background, where reading a whole decoded frame back would stall every animation on the
 * page while it waits, as Chromium on Windows does.
 *
 * @param source - The picture or video to read.
 * @returns The lights found, or none where the frame could not be read.
 */
const readLightsQuietly = async (
  source: HTMLVideoElement | HTMLImageElement,
): Promise<MoodLight[]> => {
  if (typeof createImageBitmap !== 'function') {
    return readLights(source);
  }

  try {
    const small = await createImageBitmap(source, {
      resizeWidth: READ_AT,
      resizeHeight: READ_AT,
      resizeQuality: 'low',
    });

    try {
      return readLights(small);
    } finally {
      small.close();
    }
  } catch {
    return [];
  }
};

export { readLightsQuietly };

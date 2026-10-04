import { Skia } from '@shopify/react-native-skia';
import type { SkCanvas, SkImage } from '@shopify/react-native-skia';

/**
 * Draws something off screen into a square picture, for saving rather than showing.
 *
 * @param across - How many pixels wide and high the picture is.
 * @param draw - Draws onto the picture's canvas.
 * @returns The picture, or null where the phone cannot make one.
 */
const drawPicture = (across: number, draw: (canvas: SkCanvas) => void): SkImage | null => {
  const surface = Skia.Surface.Make(across, across);

  if (surface === null) {
    return null;
  }

  draw(surface.getCanvas());
  surface.flush();

  return surface.makeImageSnapshot();
};

export { drawPicture };

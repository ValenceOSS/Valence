import { drawScene } from '@ValenceScreens/library/sketch/drawScene';
import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';

/**
 * Draws a sketch once as a PNG, for everywhere that is shown a picture rather than the strokes:
 * the phone, the television, and the server's own copy of the face.
 *
 * @param scene - The sketch.
 * @param across - How many pixels wide and high the picture is.
 * @returns The picture, or nothing where the browser could not draw it.
 */
const sketchPicture = (scene: SketchScene, across = 512): Promise<Blob | null> =>
  new Promise((settle) => {
    const target = document.createElement('canvas');
    const paint = target.getContext('2d');

    target.width = across;
    target.height = across;

    if (paint === null) {
      settle(null);

      return;
    }

    drawScene(paint, scene, across);
    target.toBlob(settle, 'image/png');
  });

export { sketchPicture };

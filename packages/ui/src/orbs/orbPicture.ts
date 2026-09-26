import { showOrb } from '@ValenceUI/orbs/showOrb';
import type { OrbLook } from '@ValenceUI/orbs/OrbLook';
import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

/**
 * Photographs an orb as a PNG, for everywhere that cannot draw one moving: the phone, the
 * television and anything else that is shown a picture rather than a shader.
 *
 * @param variant - Which orb.
 * @param look - Its settings.
 * @param across - How many pixels wide and high the picture is.
 * @returns The picture, or nothing where the browser could not draw the orb.
 */
const orbPicture = (variant: OrbVariant, look: OrbLook, across = 512): Promise<Blob | null> =>
  new Promise((settle) => {
    const target = document.createElement('canvas');
    const shown = showOrb(target, variant, () => look, { isStill: true, across });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        shown.stop();
        target.toBlob(settle, 'image/png');
      });
    });
  });

export { orbPicture };

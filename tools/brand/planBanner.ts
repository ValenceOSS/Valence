import type { Bounds } from './opaqueBounds';

const INTERIOR = 0.8;

const SHADOW_ROOM = 0.25;

type BannerPlan = { background: Bounds; artwork: Bounds; logoHeight: number };

/**
 * Plans a wide picture, such as a television icon or top shelf, cut from square renders of the app
 * icon: which band of the background to stretch across it, how much room around the logo to lift so
 * its shadow comes too, and how tall to draw the logo.
 *
 * The band is taken from the middle of the icon, well inside the rim and rounded corners Icon
 * Composer always draws, where the background is flat enough to stretch.
 *
 * @param width - The picture's width in pixels.
 * @param height - The picture's height in pixels.
 * @param logoShare - How much of the picture's height the logo takes.
 * @param renderPixels - How wide and tall the square renders are.
 * @param logo - Where the solid logo sits in the renders.
 * @returns The band, the room around the logo, and the logo's height in the picture.
 */
const planBanner = (
  width: number,
  height: number,
  logoShare: number,
  renderPixels: number,
  logo: Bounds,
): BannerPlan => {
  const bandWidth = Math.round(renderPixels * INTERIOR);
  const bandHeight = Math.min(bandWidth, Math.round((bandWidth * height) / width));
  const room = Math.round(logo.height * SHADOW_ROOM);
  const left = Math.max(0, logo.left - room);
  const top = Math.max(0, logo.top - room);

  return {
    background: {
      left: Math.round((renderPixels - bandWidth) / 2),
      top: Math.round((renderPixels - bandHeight) / 2),
      width: bandWidth,
      height: bandHeight,
    },
    artwork: {
      left,
      top,
      width: Math.min(renderPixels, logo.left + logo.width + room) - left,
      height: Math.min(renderPixels, logo.top + logo.height + room) - top,
    },
    logoHeight: Math.round(height * logoShare),
  };
};

export type { BannerPlan };

export { planBanner };

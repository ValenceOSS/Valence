import { cn } from '@ValenceUI/cn';
import type { BackdropScrimProps } from './BackdropScrim.types';

/**
 * The darkening laid over the foot of a backdrop so that a title and its controls stay readable
 * against whatever the artwork happens to be.
 *
 * The darkening is the same in both themes because it is laid over artwork rather than over the
 * page — a gradient carrying the page's colours would wash the picture out in white under the light
 * theme and then write white text on it.
 *
 * It does not fade the foot of the picture into the panel. A dialog is glass, so there is no one
 * colour to arrive at: a fade would paint a flat opaque band over a panel that is showing the
 * blurred backdrop through itself, and read as a smear rather than a join. The artwork ends at the
 * corner it is clipped to, the way its other three edges do.
 *
 * It covers the whole picture rather than the part of it that needs darkening, and keeps the ramp
 * in the bottom of the gradient instead. It fades, so it is rasterised on its own layer, and sized
 * to the foot it would land on fractions of a device pixel at top and bottom and draw a hairline
 * along both its edges. Given the same box as the picture its edges fall where the picture's
 * already do, and the clip they share is the only boundary left, as on the hero.
 *
 * The darkening down the left is anchored to the bottom corner rather than run straight across.
 * A `to right` gradient is constant top to bottom, so on a scrim that covers only part of the
 * artwork it would arrive at full strength along its own top edge and draw a hard line across the
 * picture, in both themes. Anchored at the corner it falls away upwards as well and meets nothing.
 *
 * The ramp is weighted to the bottom. Left at its midpoint the gradient would still be four fifths
 * opaque halfway up, which is well above anything it needs to hide and is where a preview's
 * subtitles sit — those are painted by the browser inside the video, so nothing can be stacked
 * beneath them and a heavy scrim simply greys them out. Reaching that opacity lower down darkens
 * what the title stands on and leaves the picture above it alone.
 *
 * @param className - Extra classes for the caller's own layout.
 */
const BackdropScrim = ({ className }: BackdropScrimProps) => (
  <div
    aria-hidden
    className={cn(
      'pointer-events-none absolute inset-0',
      'valence-artwork-scrim valence-artwork-scrim--foot',
      className,
    )}
  />
);

BackdropScrim.displayName = 'BackdropScrim';

export { BackdropScrim };

import { cn } from '@ValenceUI/cn';
import type { PictureCanvasProps } from './PictureCanvas.types';

/**
 * The one place a `<canvas>` for a moving picture is written: the surface a player draws decoded
 * frames onto itself, laid over the media element that keeps its clock and its sound. It takes no
 * pointer, so everything under and over it behaves as though it were not there.
 *
 * @param canvasRef - A handle on the canvas, for the player that draws onto it.
 * @param isShown - Whether anything is being drawn, since an empty canvas would hide the element.
 * @param className - Extra classes for the caller's own layout.
 */
const PictureCanvas = ({ canvasRef, isShown, className }: PictureCanvasProps) => (
  <canvas
    ref={canvasRef}
    aria-hidden
    className={cn('pointer-events-none bg-shade', isShown ? null : 'hidden', className)}
  />
);

PictureCanvas.displayName = 'PictureCanvas';

export { PictureCanvas };

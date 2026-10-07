import { cn } from '@ValenceUI/cn';
import type { DuoFrameProps } from './DuoFrame.types';

/**
 * A picture of the iPhone Duo with what it shows set into its screen: the screen's contents sit
 * behind the hardware's picture, which has a clear hole where the screen is, so its edges and
 * corners round the contents off as the real glass does. Every measure is in the picture's own
 * pixels, so it scales with whatever width it is given.
 *
 * @param frame - The picture of the hardware, clear where the screen is.
 * @param width - How wide that picture is, in its own pixels.
 * @param height - How tall it is.
 * @param screen - Where the screen sits within it.
 * @param className - Its size and place, which the caller decides.
 * @param children - What the screen shows.
 */
const DuoFrame = ({ frame, width, height, screen, className, children }: DuoFrameProps) => (
  <div
    className={cn('relative', className)}
    style={{ aspectRatio: `${width.toString()} / ${height.toString()}` }}
  >
    <div
      className="absolute overflow-hidden bg-shade"
      style={{
        left: `${((screen.left / width) * 100).toString()}%`,
        top: `${((screen.top / height) * 100).toString()}%`,
        width: `${((screen.width / width) * 100).toString()}%`,
        height: `${((screen.height / height) * 100).toString()}%`,
      }}
    >
      {children}
    </div>
    <img
      src={frame}
      alt=""
      aria-hidden
      draggable={false}
      className="pointer-events-none absolute inset-0 h-full w-full select-none"
    />
  </div>
);

DuoFrame.displayName = 'DuoFrame';

export { DuoFrame };

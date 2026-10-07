import { cn } from '@ValenceUI/cn';
import type { DuoFrameProps } from './DuoFrame.types';

/**
 * How round the screen's corners are, as shares of its own width and height so they scale with it:
 * the outer corners at the screen's radius, and the two on the hinge side at the hinge's own where
 * it has one.
 *
 * @param screen - Where the screen sits, and how round its corners are.
 * @returns A `border-radius` value.
 */
const cornersOf = (screen: DuoFrameProps['screen']): string => {
  const across = (radius: number) => `${((radius / screen.width) * 100).toString()}%`;
  const down = (radius: number) => `${((radius / screen.height) * 100).toString()}%`;
  const hinge = screen.hingeRadius ?? screen.radius;

  return `${across(hinge)} ${across(screen.radius)} ${across(screen.radius)} ${across(hinge)} / ${down(hinge)} ${down(screen.radius)} ${down(screen.radius)} ${down(hinge)}`;
};

/**
 * A picture of the iPhone Duo with what it shows set into its screen: the screen's contents sit
 * behind the hardware's picture, which has a clear hole where the screen is, so its edges and
 * corners round the contents off as the real glass does. Every measure is in the picture's own
 * pixels, so it scales with whatever width it is given.
 *
 * @param frame - The picture of the hardware, clear where the screen is.
 * @param width - How wide that picture is, in its own pixels.
 * @param height - How tall it is.
 * @param screen - Where the screen sits within it, how round its corners are, and how round the
 *   two on the hinge side are where they differ.
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
        borderRadius: cornersOf(screen),
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

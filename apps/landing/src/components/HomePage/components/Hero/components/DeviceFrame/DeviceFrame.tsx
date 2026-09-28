import { cn } from '@ValenceUI/cn';
import type { DeviceFrameProps } from './DeviceFrame.types';

/**
 * A screenshot of the web app, rounded as a window's contents are, lifted off the page on a shadow
 * and a hairline edge rather than dressed in a browser drawn around it.
 *
 * @param src - The screenshot.
 * @param alt - What it shows, for anybody who cannot see it.
 * @param shape - What it is a screenshot of, which for now is only ever the web.
 * @param className - Extra classes for the caller's own layout.
 */
const DeviceFrame = ({ src, alt, shape, className }: DeviceFrameProps) => (
  <img
    src={src}
    alt={alt}
    loading="eager"
    draggable={false}
    data-shape={shape}
    className={cn(
      'block w-full select-none rounded-xl shadow-[var(--shadow-cast)] ring-1 ring-on-scrim/10 sm:rounded-2xl',
      className,
    )}
  />
);

DeviceFrame.displayName = 'DeviceFrame';

export { DeviceFrame };

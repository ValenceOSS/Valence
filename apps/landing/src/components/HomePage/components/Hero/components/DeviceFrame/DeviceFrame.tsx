import { cn } from '@ValenceUI/cn';
import type { DeviceFrameProps } from './DeviceFrame.types';

/**
 * A screenshot of the web app, held in a rim of glass the way the app's own dialogs are: a few
 * pixels of frosted, tinted border with a hairline edge, blurring whatever is behind it, and the
 * picture rounded inside it, lifted off the page on a shadow.
 *
 * @param src - The screenshot.
 * @param alt - What it shows, for anybody who cannot see it.
 * @param shape - What it is a screenshot of, which for now is only ever the web.
 * @param className - Extra classes for the caller's own layout.
 */
const DeviceFrame = ({ src, alt, shape, className }: DeviceFrameProps) => (
  <div
    data-shape={shape}
    className={cn(
      'valence-glass valence-glass--film rounded-[1rem] p-1.5 shadow-[var(--shadow-cast)] sm:rounded-[1.6rem] sm:p-2',
      className,
    )}
  >
    <img
      src={src}
      alt={alt}
      loading="eager"
      draggable={false}
      className="block w-full select-none rounded-[0.65rem] sm:rounded-2xl"
    />
  </div>
);

DeviceFrame.displayName = 'DeviceFrame';

export { DeviceFrame };

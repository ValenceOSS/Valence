import { cn } from '@ValenceUI/cn';
import type { PhoneFrameProps } from './PhoneFrame.types';

const SCREEN =
  'absolute left-[5.4%] top-[2.3%] h-[95.4%] w-[89.7%] overflow-hidden rounded-[13%/6%]';

/**
 * A phone held upright, drawn in an iPhone's own frame, its screen showing one part of the phone app
 * — the screenshot where there is one, or until there is, a quiet sketch of a screen named for what
 * it will show. The screen sits behind the frame and shows through its glass, so the island and the
 * bezel stay on top of whatever is on it.
 *
 * @param label - Which part of the app the screen shows, read out in place of the picture.
 * @param src - The screenshot, where there is one yet.
 * @param className - Its size and place in the fan, which the fan decides.
 */
const PhoneFrame = ({ label, src, className }: PhoneFrameProps) => (
  <figure className={cn('relative aspect-[448/916] drop-shadow-[var(--shadow-cast)]', className)}>
    {src === undefined ? (
      <div
        role="img"
        aria-label={label}
        className={cn(
          SCREEN,
          'flex flex-col gap-3 bg-linear-to-b from-phone-glass to-phone-floor p-4 pt-12',
        )}
      >
        <span className="h-4 w-2/3 rounded-full bg-on-scrim/25" />
        <span className="aspect-square w-full rounded-2xl bg-on-scrim/10" />
        <span className="h-3 w-1/2 rounded-full bg-on-scrim/20" />
        <span className="h-3 w-1/3 rounded-full bg-on-scrim/10" />
        <span className="mt-auto flex justify-center pb-3 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-on-scrim/45">
          {label}
        </span>
      </div>
    ) : (
      <img
        src={src}
        alt={label}
        loading="lazy"
        draggable={false}
        className={cn(SCREEN, 'select-none object-cover object-top')}
      />
    )}

    <img
      src="/devices/iphone.png"
      alt=""
      draggable={false}
      className="pointer-events-none relative block h-full w-full select-none"
    />
  </figure>
);

PhoneFrame.displayName = 'PhoneFrame';

export { PhoneFrame };

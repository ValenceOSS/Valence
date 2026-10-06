import { cn } from '@ValenceUI/cn';
import type { PhoneFrameProps } from './PhoneFrame.types';

/**
 * A phone held upright, its screen showing one part of the phone app — the screenshot where there is
 * one, or until there is, a quiet sketch of a screen named for what it will show.
 *
 * @param label - Which part of the app the screen shows, read out in place of the picture.
 * @param src - The screenshot, where there is one yet.
 * @param className - Its size and place in the fan, which the fan decides.
 */
const PhoneFrame = ({ label, src, className }: PhoneFrameProps) => (
  <figure
    className={cn(
      'aspect-[9/19.5] overflow-hidden rounded-[2.6rem] border-[7px] border-phone-edge bg-phone-edge shadow-[var(--shadow-cast)] ring-1 ring-on-scrim/10',
      className,
    )}
  >
    {src === undefined ? (
      <div
        role="img"
        aria-label={label}
        className="flex h-full flex-col gap-3 rounded-[2.1rem] bg-linear-to-b from-phone-glass to-phone-floor p-4 pt-10"
      >
        <span className="h-4 w-2/3 rounded-full bg-on-scrim/25" />
        <span className="aspect-square w-full rounded-2xl bg-on-scrim/10" />
        <span className="h-3 w-1/2 rounded-full bg-on-scrim/20" />
        <span className="h-3 w-1/3 rounded-full bg-on-scrim/10" />
        <span className="mt-auto flex justify-center pb-2 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-on-scrim/45">
          {label}
        </span>
      </div>
    ) : (
      <img
        src={src}
        alt={label}
        loading="lazy"
        draggable={false}
        className="h-full w-full select-none rounded-[2.1rem] object-cover"
      />
    )}
  </figure>
);

PhoneFrame.displayName = 'PhoneFrame';

export { PhoneFrame };

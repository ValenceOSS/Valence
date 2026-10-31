import { cn } from '@ValenceUI/cn';
import { webpSourcesOf } from '@ValenceLanding/webpSourcesOf';
import type { HeroWindowProps } from './HeroWindow.types';

/**
 * The web app held in a window, rounded inside a hairline frame, showing one of several screenshots
 * at a time and fading from one to the next as the showing one changes. Only the showing screenshot
 * is named to assistive technology, and whoever asked for stillness sees the change made at once.
 *
 * @param shots - The screenshots, in order.
 * @param active - Which screenshot is showing.
 * @param isStill - Whether the change is made without a fade.
 * @param className - Where the caller places it.
 */
const HeroWindow = ({ shots, active, isStill, className }: HeroWindowProps) => (
  <div
    className={cn(
      'rounded-[0.9rem] border border-[var(--surface-line)] bg-[var(--frame-panel)] p-1.5 shadow-[var(--shadow-cast)] sm:rounded-[1.4rem] sm:p-2.5',
      className,
    )}
  >
    <div className="relative overflow-hidden rounded-[0.55rem] border border-[var(--surface-line)] bg-aurora sm:rounded-[0.9rem]">
      {shots.map((shot, at) => {
        const isShowing = at === active;

        return (
          <img
            key={shot.id}
            src={shot.src}
            srcSet={webpSourcesOf(shot.src, [800, 1600, 2400])}
            sizes="(min-width: 84rem) 82rem, 100vw"
            width={2400}
            height={1350}
            alt={shot.alt}
            aria-hidden={!isShowing}
            loading={at === 0 ? 'eager' : 'lazy'}
            draggable={false}
            className={cn(
              'block w-full select-none',
              at === 0 ? 'relative' : 'absolute inset-0 h-full object-cover object-top',
              isShowing ? 'opacity-100' : 'opacity-0',
              isStill ? '' : 'transition-opacity duration-700 ease-out',
            )}
          />
        );
      })}
    </div>
  </div>
);

HeroWindow.displayName = 'HeroWindow';

export { HeroWindow };

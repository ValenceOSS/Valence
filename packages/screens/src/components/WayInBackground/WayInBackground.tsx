import { useEffect, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { MoodBackground } from '@ValenceUI/MoodBackground';
import type { WayInBackgroundProps } from './WayInBackground.types';

/**
 * The ground behind the way in: the household's own picture where it has set one, dimmed, over a
 * drifting field of light.
 *
 * Kept as its own component because more than one screen stands on it. Signing in and setting a
 * household up are one continuous moment to the person going through them, and the second looking
 * like a bare form after the first is what makes it read as two different pieces of software.
 *
 * It fades in on the first frame rather than appearing with the page, which is what stops a
 * background image arriving as a flash behind text somebody is already reading.
 *
 * @param splashscreen - The picture an operator set behind the way in, where there is one.
 * @param lights - What to tint the drifting field with.
 */
const WayInBackground = ({ splashscreen = null, lights = [] }: WayInBackgroundProps) => {
  const [hasGround, setHasGround] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHasGround(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 -z-10',
        'transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none',
        hasGround ? 'opacity-100' : 'opacity-0',
      )}
    >
      {splashscreen === null ? null : (
        <>
          <img src={splashscreen} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-surface/55" />
        </>
      )}

      <div className={cn('absolute inset-0 isolate', splashscreen === null ? '' : 'opacity-50')}>
        <MoodBackground lights={lights} hasGrid isDrifting />
      </div>
    </div>
  );
};

WayInBackground.displayName = 'WayInBackground';

export { WayInBackground };

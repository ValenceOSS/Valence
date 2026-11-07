import { useEffect, useRef } from 'react';
import { cn } from '@ValenceUI/cn';
import type { DialogFootBlurProps } from './DialogFootBlur.types';

const FADE_DISTANCE = 96;

/**
 * Blurs what scrolls under the foot of a dialog, into a colour where there is one, and goes once
 * there is nothing further to scroll to, fading with how much of the scroll is left.
 *
 * @param colour - The colour to blur into, or nothing for the blur alone.
 */
const DialogFootBlur = ({ colour }: DialogFootBlurProps) => {
  const blurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const face = blurRef.current?.parentElement;
    const scroller = face?.querySelector('[data-slot="dialog-scroller"]');

    const blur = blurRef.current;

    if (
      blur === null ||
      face === null ||
      face === undefined ||
      scroller === null ||
      scroller === undefined
    ) {
      return;
    }

    const measure = () => {
      const left = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;

      blur.style.opacity = String(Math.min(Math.max(left, 0) / FADE_DISTANCE, 1));
    };
    const resizes = new ResizeObserver(measure);
    const watch = () => {
      resizes.disconnect();
      resizes.observe(scroller);

      for (const child of scroller.children) {
        resizes.observe(child);
      }

      measure();
    };
    const changes = new MutationObserver(watch);

    watch();
    changes.observe(scroller, { childList: true });
    scroller.addEventListener('scroll', measure, { passive: true });

    return () => {
      resizes.disconnect();
      changes.disconnect();
      scroller.removeEventListener('scroll', measure);
    };
  }, []);

  return (
    <div
      ref={blurRef}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 backdrop-blur-md [mask-image:linear-gradient(to_top,black,transparent)]',
        'opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none',
      )}
      {...(colour === null ? {} : { style: { backgroundColor: colour } })}
    />
  );
};

DialogFootBlur.displayName = 'DialogFootBlur';

export { DialogFootBlur };

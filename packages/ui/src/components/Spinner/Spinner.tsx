import { Icon } from '@ValenceUI/Icon';
import { CircleProgressThreeQuarter as CircleProgressIcon } from '@keyline-icons/react';
import { progressIconFor } from './progressIconFor';
import { cn } from '@ValenceUI/cn';
import type { SpinnerProps, SpinnerSize } from './Spinner.types';

const SIZE_PIXELS: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
};

/**
 * Shows that something is happening without claiming to know how far along it is. The label is
 * required rather than optional: a spinner is invisible to anybody not looking at the screen, and
 * this is the only thing that says what is being waited for.
 *
 * @param size - How large to draw it, from inside a badge to the middle of a page.
 * @param label - What is being waited for, read out and shown to anybody hovering.
 * @param progress - How far along it is, from nothing to done, where that is known: the ring then
 *   holds still and fills a quarter at a time, and is read out as a progress bar.
 * @param isCentered - Whether it stands in the middle of the space it was given, for a spinner that is
 *   all an area shows while it loads. Left to sit where it falls, it lands in the top corner of a panel
 *   that is otherwise empty, which reads as a fault rather than as something arriving.
 * @param isPageCentered - Whether it stands in the middle of the page instead, for a spinner that is
 *   all a whole page shows while it loads, so it waits where the page's content will appear rather
 *   than at the top of an area that has not grown yet.
 * @param className - Extra classes for the caller's own layout.
 *
 * It turns on a CSS animation, which the browser keeps running while the page is busy working out
 * what it has just been given — exactly when a spinner is on screen.
 */
const Spinner = ({
  size = 'md',
  label,
  progress,
  isCentered = false,
  isPageCentered = false,
  className,
}: SpinnerProps) => {
  const spinner =
    progress === undefined ? (
      <span
        role="status"
        aria-label={label}
        className={cn(
          'valence-spin inline-flex shrink-0 items-center justify-center self-center leading-none text-current',
          className,
        )}
      >
        <Icon of={CircleProgressIcon} size={SIZE_PIXELS[size]} />
      </span>
    ) : (
      <span
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(Math.max(progress, 0), 1) * 100)}
        className={cn(
          'inline-flex shrink-0 items-center justify-center self-center leading-none text-current',
          className,
        )}
      >
        <Icon of={progressIconFor(progress)} size={SIZE_PIXELS[size]} />
      </span>
    );

  if (isPageCentered) {
    return (
      <div className="flex min-h-[calc(100svh-12rem)] w-full items-center justify-center p-6">
        {spinner}
      </div>
    );
  }

  return isCentered ? (
    <div className="flex h-full min-h-16 w-full items-center justify-center p-6">{spinner}</div>
  ) : (
    spinner
  );
};

Spinner.displayName = 'Spinner';

export { Spinner };

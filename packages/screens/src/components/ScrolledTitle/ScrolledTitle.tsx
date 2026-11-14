import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import type { ScrolledTitleProps } from './ScrolledTitle.types';

/**
 * The bar that takes over from a heading once it has been scrolled away: the artwork shrunk to a
 * thumbnail, the title beside it, and whatever the heading was carrying on its right.
 *
 * A dialog whose subject only appears at the very top stops saying what it is about the moment
 * somebody reads past it — and the way out goes with it. This keeps both, without holding a
 * screen's worth of artwork in place to do it.
 *
 * It hangs out of a sticky box with no height of its own, so it takes up no room until it is
 * wanted and then floats over what it is standing in for. Giving it real height instead leaves a
 * band of nothing above the artwork before anybody has scrolled at all.
 *
 * It reaches the dialog's own edges rather than sitting inside its margin, so it reads as part of
 * the dialog's frame rather than as a card that happens to be stuck to the top of the content.
 * Its ground also starts a sliver above its own top edge. It is pulled up by exactly the content's
 * padding, but both are in rem, and where the root size is not a whole number of pixels the two
 * round differently — leaving a hairline at the top of the dialog for the scrolling content to show
 * through.
 *
 * The ground is solid, because a title with somebody else's sentence sliding through it cannot be
 * read at all. It is a little lighter than the dialog's tint, with a line and a shadow along its
 * foot, so it stands clear of what scrolls beneath it.
 *
 * @param title - What the dialog is about.
 * @param artwork - Where to fetch the picture beside it, or nothing to leave it out.
 * @param detail - A line beneath the title, such as its year and age rating.
 * @param isShowing - Whether the heading has been scrolled past.
 * @param tint - The colour of the dialog's ground to stand on, or nothing for the plain surface.
 * @param children - The controls that sit at the right, such as closing.
 */
const ScrolledTitle = ({
  title,
  artwork,
  detail,
  isShowing,
  tint,
  children,
}: ScrolledTitleProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isTinted = tint !== null && tint !== undefined;

  return (
    <div className="sticky -top-3 z-20 -mx-3 h-0 sm:-top-4 sm:-mx-4">
      <motion.div
        aria-hidden={!isShowing}
        animate={{
          opacity: isShowing ? 1 : 0,
          y: isShowing || prefersReducedMotion === true ? 0 : -8,
        }}
        transition={{ duration: prefersReducedMotion === true ? 0 : 0.18, ease: 'easeOut' }}
        className={cn(
          'relative isolate flex items-center gap-3 px-4 py-2 sm:px-5',
          isShowing ? '' : 'pointer-events-none',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-0 -top-0.5 bottom-0 -z-10 border-b shadow-[var(--shadow-overlay)] sm:rounded-t-xl',
            isTinted ? '' : 'border-[var(--surface-line)] bg-surface-raised',
          )}
          {...(isTinted
            ? {
                style: {
                  backgroundColor: `color-mix(in oklab, ${tint} 90%, white)`,
                  borderColor: `color-mix(in oklab, ${tint} 72%, white)`,
                },
              }
            : {})}
        />

        {artwork === null || artwork === undefined ? null : (
          <img
            src={artwork}
            alt=""
            className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-[var(--surface-line)]"
            loading="lazy"
          />
        )}

        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base font-semibold leading-tight text-text">{title}</span>

          {detail === undefined || detail === null ? null : (
            <span className="flex min-w-0 items-center gap-2 truncate font-body text-xs text-text-muted">
              {detail}
            </span>
          )}
        </span>

        {children === undefined ? null : (
          <span
            className="ms-auto flex shrink-0 items-center gap-2"
            {...(isTinted ? { style: Object.fromEntries([['--title-tint', tint]]) } : {})}
          >
            {children}
          </span>
        )}
      </motion.div>
    </div>
  );
};

ScrolledTitle.displayName = 'ScrolledTitle';

export { ScrolledTitle };

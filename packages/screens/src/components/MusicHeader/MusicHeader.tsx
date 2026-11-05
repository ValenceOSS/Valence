import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { MusicBackdrop } from '@ValenceScreens/components/MusicBackdrop/MusicBackdrop';
import type { MusicHeaderProps } from './MusicHeader.types';

const SQUARES = [
  '[&_button:not([data-music-play])]:flex [&_button:not([data-music-play])]:size-[3.25rem]',
  '[&_button:not([data-music-play])]:items-center [&_button:not([data-music-play])]:justify-center',
  '[&_button:not([data-music-play])]:rounded-[0.875rem]',
  '[&_button:not([data-music-play])]:text-text-muted [&_button:not([data-music-play])]:hover-hover:hover:bg-hover [&_button:not([data-music-play])]:hover-hover:hover:text-text',
  '[&_button:not([data-music-play])]:active:scale-[0.96]',
].join(' ');

const SQUARES_ON_ARTWORK = [
  SQUARES,
  '[&_button:not([data-music-play])]:bg-[var(--color-glass)] [&_button:not([data-music-play])]:text-on-scrim',
  '[&_button:not([data-music-play])]:hover-hover:hover:bg-[var(--color-glass-hover)]',
  'md:[&_[data-music-play]]:mr-auto md:[&_[data-music-play]]:w-[21rem]',
].join(' ');

/**
 * The top of something to listen to, drawn one of two ways. Anything that is a list of songs gets a
 * banner on the page's own light: its cover, what it is called set large beside it, the details
 * under that, and a row of what can be done above the songs. A person gets their picture across the
 * whole width instead, fading into the page with their name low on it, because a photograph is what
 * is worth looking at there.
 *
 * @param eyebrow - What kind of thing this is.
 * @param title - What it is called.
 * @param artwork - Its cover, where one stands in front of the picture.
 * @param layout - A banner above the songs, or a hero across the page.
 * @param backdrop - The picture across a hero, or nothing to stand on the page's own light.
 * @param isBackdropSharp - Whether that picture is meant to be seen rather than melted into colour.
 * @param details - The line beneath.
 * @param actions - The buttons that play it, and what else can be done.
 */
const MusicHeader = ({
  eyebrow,
  title,
  artwork,
  layout = 'banner',
  backdrop = null,
  isBackdropSharp = false,
  details,
  actions,
}: MusicHeaderProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const rises = revealVariants(prefersReducedMotion);
  const moves = revealTransition(prefersReducedMotion);

  if (layout === 'banner') {
    return (
      <header className="flex flex-col">
        <div className="flex flex-col gap-5 px-[var(--music-lane)] pt-10 pb-6 sm:flex-row sm:items-end sm:gap-7">
          {artwork === undefined ? null : (
            <div className="w-44 shrink-0 rounded-xl shadow-[var(--shadow-overlay)] lg:w-56">
              {artwork}
            </div>
          )}

          <motion.div
            variants={staggerVariants}
            initial="hidden"
            animate="shown"
            className="@container flex min-w-0 flex-1 flex-col gap-2"
          >
            <motion.span
              variants={rises}
              transition={moves}
              className="text-xs font-semibold text-text"
            >
              {eyebrow}
            </motion.span>

            <motion.h1
              variants={rises}
              transition={moves}
              className="text-[clamp(2rem,11cqi,6rem)] font-bold leading-[0.95] tracking-[-0.04em] text-balance text-text"
            >
              {title}
            </motion.h1>

            {details === undefined ? null : (
              <motion.div
                variants={rises}
                transition={moves}
                className="flex flex-wrap items-center gap-x-1.5 pt-2 text-sm text-text-muted"
              >
                {details}
              </motion.div>
            )}
          </motion.div>
        </div>

        {actions === undefined ? null : (
          <motion.div
            variants={rises}
            initial="hidden"
            animate="shown"
            transition={moves}
            className={cn(
              'flex flex-wrap items-center gap-1 px-[var(--music-lane)] pb-4 sm:[&_[data-music-play]]:mr-3 sm:[&_[data-music-play]]:w-44',
              SQUARES,
            )}
          >
            {actions}
          </motion.div>
        )}
      </header>
    );
  }

  const words = backdrop === null ? 'text-text' : 'text-on-scrim';

  return (
    <header className="flex flex-col">
      <div className="relative flex min-h-[22rem] flex-col justify-end gap-6 overflow-hidden px-[var(--music-lane)] pt-12 pb-6 lg:min-h-[30rem]">
        <MusicBackdrop src={backdrop} isSharp={isBackdropSharp} />

        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8"
        >
          {artwork === undefined ? null : (
            <div className="w-36 shrink-0 sm:w-44 lg:w-52">{artwork}</div>
          )}

          <div className="@container flex min-w-0 flex-1 flex-col gap-2">
            <motion.span
              variants={rises}
              transition={moves}
              className={cn('text-xs font-semibold', words)}
            >
              {eyebrow}
            </motion.span>

            <motion.h1
              variants={rises}
              transition={moves}
              className={cn(
                'text-[clamp(2.25rem,11cqi,6.5rem)] font-bold leading-[0.92] tracking-[-0.04em] text-balance',
                words,
              )}
            >
              {title}
            </motion.h1>
          </div>
        </motion.div>

        {actions === undefined ? null : (
          <motion.div
            variants={rises}
            initial="hidden"
            animate="shown"
            transition={moves}
            className={cn('relative flex flex-wrap items-center gap-2', SQUARES_ON_ARTWORK)}
          >
            {actions}
          </motion.div>
        )}
      </div>

      {details === undefined ? null : (
        <div className="flex flex-wrap items-center gap-x-1.5 px-[var(--music-lane)] pt-2 pb-6 text-[0.9375rem] text-text-muted">
          {details}
        </div>
      )}
    </header>
  );
};

MusicHeader.displayName = 'MusicHeader';

export { MusicHeader };

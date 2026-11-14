import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { MusicBackdrop } from '@ValenceScreens/components/MusicBackdrop/MusicBackdrop';
import { TitleHero } from '@ValenceScreens/components/TitleHero/TitleHero';
import type { MusicHeaderProps } from './MusicHeader.types';

const SQUARES_ON_ARTWORK = [
  '[&_button:not([data-music-play])]:flex [&_button:not([data-music-play])]:size-[3.25rem]',
  '[&_button:not([data-music-play])]:items-center [&_button:not([data-music-play])]:justify-center',
  '[&_button:not([data-music-play])]:rounded-[0.875rem] [&_button:not([data-music-play])]:text-on-scrim',
  '[&_button:not([data-music-play])]:bg-[color-mix(in_oklab,var(--title-tint,var(--color-glass))_40%,var(--color-glass))]',
  '[&_button:not([data-music-play])]:hover-hover:hover:bg-[var(--color-glass-hover)]',
  '[&_button:not([data-music-play])]:active:scale-[0.96]',
  'md:[&_[data-music-play]]:me-auto md:[&_[data-music-play]]:w-[21rem]',
].join(' ');

/**
 * The head of an album, an artist or a list of songs, as a film's dialog opens: its picture to the
 * dialog's edges and fading into the ground below, what it is called low on it, one wide play button
 * and the rest as squares at the far side, with the details beneath where they are read.
 *
 * @param eyebrow - What kind of thing this is.
 * @param title - What it is called.
 * @param artwork - Its cover, where one stands in front of the picture.
 * @param backdrop - The picture across the head.
 * @param isBackdropSharp - Whether that picture is meant to be seen rather than melted into colour.
 * @param details - The line beneath.
 * @param actions - The buttons that play it, and what else can be done.
 */
const MusicHeader = ({
  eyebrow,
  title,
  artwork,
  backdrop = null,
  isBackdropSharp = false,
  details,
  actions,
}: MusicHeaderProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const rises = revealVariants(prefersReducedMotion);
  const moves = revealTransition(prefersReducedMotion);

  return (
    <header className="flex flex-col">
      <TitleHero preview={<MusicBackdrop src={backdrop} isSharp={isBackdropSharp} />}>
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className="flex flex-col gap-6"
        >
          <div className="flex items-end gap-5 sm:gap-7">
            {artwork === undefined ? null : (
              <div className="hidden w-32 shrink-0 sm:block lg:w-40">{artwork}</div>
            )}

            <div className="@container flex min-w-0 flex-1 flex-col gap-1.5">
              <motion.span
                variants={rises}
                transition={moves}
                className="text-xs font-semibold text-on-scrim"
              >
                {eyebrow}
              </motion.span>

              <motion.h2
                variants={rises}
                transition={moves}
                className="max-w-[18ch] text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-balance text-on-scrim"
              >
                {title}
              </motion.h2>
            </div>
          </div>

          {actions === undefined ? null : (
            <motion.div
              variants={rises}
              transition={moves}
              className={cn('flex flex-wrap items-center gap-2', SQUARES_ON_ARTWORK)}
            >
              {actions}
            </motion.div>
          )}
        </motion.div>
      </TitleHero>

      {details === undefined ? null : (
        <div className="flex flex-wrap items-center gap-x-1.5 px-1 pt-2 pb-6 text-base text-text-muted sm:px-2">
          {details}
        </div>
      )}
    </header>
  );
};

MusicHeader.displayName = 'MusicHeader';

export { MusicHeader };

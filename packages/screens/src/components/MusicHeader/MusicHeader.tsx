import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import type { MusicHeaderProps } from './MusicHeader.types';

/**
 * The top of an album, an artist or a playlist: its picture large, what it is and what it is
 * called, a line of details, and the buttons that play it.
 *
 * There is no panel behind it. The room itself is lit in the colours of the picture, the way the
 * home page is lit by its film, so the header is type and artwork standing on the page rather than
 * a coloured box laid across the top of it. The title is sized to the room its column has, so a
 * long one is set smaller rather than broken in the middle of a word. The words arrive one after another beside the picture,
 * which has usually just travelled up from the tile that opened it.
 *
 * @param eyebrow - What kind of thing this is.
 * @param title - What it is called.
 * @param artwork - Its picture.
 * @param details - The line beneath the title.
 * @param actions - The buttons that play it.
 */
const MusicHeader = ({ eyebrow, title, artwork, details, actions }: MusicHeaderProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const rises = revealVariants(prefersReducedMotion);
  const moves = revealTransition(prefersReducedMotion);

  return (
    <header className="flex flex-col gap-6 px-[var(--music-lane)] pt-6 pb-8 sm:flex-row sm:items-end sm:gap-8">
      <div className="w-44 shrink-0 shadow-[var(--shadow-overlay)] sm:w-56 lg:w-64">{artwork}</div>

      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate="shown"
        className="@container flex min-w-0 flex-1 flex-col gap-3"
      >
        <motion.span
          variants={rises}
          transition={moves}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted"
        >
          {eyebrow}
        </motion.span>

        <motion.h1
          variants={rises}
          transition={moves}
          className="text-[clamp(1.5rem,10cqi,5rem)] font-bold leading-[0.95] tracking-[-0.035em] text-balance text-text"
        >
          {title}
        </motion.h1>

        {details === undefined ? null : (
          <motion.div
            variants={rises}
            transition={moves}
            className="flex flex-wrap items-center gap-x-1.5 text-sm text-text-muted"
          >
            {details}
          </motion.div>
        )}

        {actions === undefined ? null : (
          <motion.div
            variants={rises}
            transition={moves}
            className="mt-3 flex flex-wrap items-center gap-3"
          >
            {actions}
          </motion.div>
        )}
      </motion.div>
    </header>
  );
};

MusicHeader.displayName = 'MusicHeader';

export { MusicHeader };

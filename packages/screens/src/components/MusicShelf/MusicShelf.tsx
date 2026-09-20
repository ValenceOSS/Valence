import { motion } from 'motion/react';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Rail } from '@ValenceUI/Rail';
import { groupVariants } from '@ValenceUI/animations/reveal';
import type { MusicShelfProps } from './MusicShelf.types';

/**
 * A run of albums, artists or playlists under a heading, either as a rail that pages sideways —
 * the same rail the film pages use — or as a grid that wraps, for a page that is only that list.
 *
 * Either way each tile is revealed a moment after the one before it, so a shelf assembles rather
 * than appears.
 *
 * @param heading - What the shelf holds.
 * @param layout - A rail to page through, or a grid to scroll down.
 * @param count - How many there are, where that is worth saying.
 * @param action - Anything to do with the whole shelf, beside its heading.
 * @param children - The tiles, each in a reveal item.
 */
const MusicShelf = ({ heading, layout = 'rail', count, action, children }: MusicShelfProps) => {
  if (layout === 'rail') {
    return (
      <Rail
        title={heading}
        sizesCards
        cards="portrait"
        className="[--rail-lane:var(--music-lane)] sm:[--rail-lane:var(--music-lane)]"
        {...(count === undefined ? {} : { count })}
        {...(action === undefined ? {} : { action })}
      >
        {children}
      </Rail>
    );
  }

  return (
    <section aria-label={heading} className="flex flex-col gap-4 px-[var(--music-lane)]">
      <header className="flex items-end justify-between gap-4">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-text">
          {heading}
          {count === undefined ? null : (
            <AnimatedNumber value={count} className="text-sm font-normal text-text-muted/70" />
          )}
        </h2>
        {action}
      </header>

      <motion.ul
        variants={groupVariants}
        initial="hidden"
        animate="shown"
        className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-x-5 gap-y-8"
      >
        {children}
      </motion.ul>
    </section>
  );
};

MusicShelf.displayName = 'MusicShelf';

export { MusicShelf };

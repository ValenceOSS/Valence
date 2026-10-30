import { useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { useReached } from '@ValenceUI/useReached';

const SCREENS = [
  { label: 'Web', mark: 'chrome' },
  { label: 'iPhone and iPad', mark: 'apple' },
  { label: 'Android', mark: 'android' },
  { label: 'Apple TV', mark: 'apple' },
  { label: 'Android TV', mark: 'android' },
  { label: 'Desktop', mark: 'windows' },
] as const;

const MARK_SIZE = 22;

/**
 * The screens Valence plays on, set out in one even row of marks and names like a strip of logos,
 * with a small caption beneath.
 */
const ScreensStrip = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const listRef = useRef<HTMLUListElement>(null);
  const isReached = useReached(listRef, { margin: '-40px' });

  return (
    <section
      aria-label="Screens Valence plays on"
      className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 sm:px-10 sm:py-24"
    >
      <motion.ul
        ref={listRef}
        initial="hidden"
        animate={isReached ? 'shown' : 'hidden'}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
        className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:flex lg:items-center lg:justify-between"
      >
        {SCREENS.map((screen) => (
          <li
            key={screen.label}
            className="flex items-center gap-2.5 text-lg font-medium tracking-[-0.02em] text-text sm:text-xl"
          >
            <BrandGlyph of={screen.mark} size={MARK_SIZE} />
            {screen.label}
          </li>
        ))}
      </motion.ul>

      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted">
        Plays on every screen in the house
      </p>
    </section>
  );
};

ScreensStrip.displayName = 'ScreensStrip';

export { ScreensStrip };

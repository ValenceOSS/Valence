import { useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { groupVariants, revealItemVariants } from '@ValenceUI/animations/reveal';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { useReached } from '@ValenceUI/useReached';

const SCREENS = [
  { label: 'Web', mark: 'chrome', where: 'Any modern browser' },
  { label: 'iPhone and iPad', mark: 'apple', where: 'The App Store' },
  { label: 'Android', mark: 'android', where: 'Google Play' },
  { label: 'Apple TV', mark: 'apple', where: 'tvOS' },
  { label: 'Android TV', mark: 'android', where: 'Google TV and more' },
  { label: 'Desktop', mark: 'windows', where: 'Windows, Mac and Linux' },
] as const;

const MARK_SIZE = 40;

/**
 * The screens Valence plays on, each in a cell of its own in one ruled grid: a large mark, the
 * screen's name, and where the app for it comes from. The cells rise in one after another as the
 * grid is reached, and a cell lifts its mark when pointed at.
 */
const ScreensStrip = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const listRef = useRef<HTMLUListElement>(null);
  const isReached = useReached(listRef, { margin: '-40px' });

  return (
    <section
      aria-label="Screens Valence plays on"
      className="mx-auto max-w-7xl px-5 py-16 sm:px-10 sm:py-20"
    >
      <motion.ul
        ref={listRef}
        initial="hidden"
        animate={isReached ? 'shown' : 'hidden'}
        variants={groupVariants}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--surface-line)] bg-[var(--surface-line)] sm:grid-cols-3 lg:grid-cols-6"
      >
        {SCREENS.map((screen, at) => (
          <motion.li
            key={screen.label}
            custom={at}
            variants={revealItemVariants(prefersReducedMotion)}
            className="group flex flex-col items-center gap-4 bg-[var(--frame-back)] px-4 py-8 text-center transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-hover)] sm:py-10"
          >
            <span className="text-text-muted transition-[color,transform] duration-[var(--duration-fast)] group-hover:-translate-y-0.5 group-hover:text-text">
              <BrandGlyph of={screen.mark} size={MARK_SIZE} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-base font-semibold tracking-[-0.01em] text-text">
                {screen.label}
              </span>
              <span className="text-sm text-text-muted">{screen.where}</span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
};

ScreensStrip.displayName = 'ScreensStrip';

export { ScreensStrip };

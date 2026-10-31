import { useRef } from 'react';
import { motion } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { useReached } from '@ValenceUI/useReached';
import { AppWindow as AppWindowIcon, Laptop as LaptopIcon } from '@keyline-icons/react/fill';
import { ScreenTile } from './components/ScreenTile/ScreenTile';

const SCREENS = [
  { label: 'Web', mark: AppWindowIcon, where: 'Any modern browser' },
  { label: 'iPhone and iPad', mark: 'apple', where: 'The App Store' },
  { label: 'Android', mark: 'android', where: 'Google Play' },
  { label: 'Apple TV', mark: 'apple', where: 'tvOS' },
  { label: 'Android TV', mark: 'android', where: 'Google TV and more' },
  { label: 'Desktop', mark: LaptopIcon, where: 'Windows, Mac and Linux' },
] as const;

/**
 * The screens Valence plays on, each on a solid tile of its own in one tray: a large mark, the
 * screen's name, and where the app for it comes from. The cells rise in one after another as the
 * grid is reached, a light passes along the marks every few seconds, and each tile answers the
 * pointer.
 */
const ScreensStrip = () => {
  const listRef = useRef<HTMLUListElement>(null);
  const isReached = useReached(listRef, { margin: '-40px' });

  return (
    <section
      aria-label="Screens Valence plays on"
      className="px-2 pb-14 pt-16 sm:px-3 sm:pb-[4.25rem] sm:pt-20"
    >
      <div className="mx-auto max-w-[87rem] px-3 sm:px-10">
        <motion.ul
          ref={listRef}
          initial="hidden"
          animate={isReached ? 'shown' : 'hidden'}
          variants={groupVariants}
          className="grid grid-cols-2 gap-1.5 rounded-[1.6rem] border border-[var(--surface-line)] bg-[var(--frame-panel)] p-1.5 sm:grid-cols-3 lg:grid-cols-6"
        >
          {SCREENS.map((screen, at) => (
            <ScreenTile key={screen.label} screen={screen} index={at} count={SCREENS.length} />
          ))}
        </motion.ul>
      </div>
    </section>
  );
};

ScreensStrip.displayName = 'ScreensStrip';

export { ScreensStrip };

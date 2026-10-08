import { useLayoutEffect } from 'react';
import { motion, useIsPresent, useReducedMotionConfig } from 'motion/react';
import type { Variants } from 'motion/react';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { useFitHeight } from '@ValenceLanding/components/LandingNav/useFitHeight';
import { NavEntry } from '@ValenceLanding/components/LandingNav/components/NavEntry/NavEntry';
import type { NavPanelProps } from './NavPanel.types';

const SHIFT_PX = 28;

const ENTER_EASE = [0.23, 1, 0.32, 1] as const;

const SECTION_VARIANTS: Variants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction * SHIFT_PX }),
  shown: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.32,
      ease: ENTER_EASE,
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
  gone: (direction: number) => ({
    opacity: 0,
    x: direction * -SHIFT_PX,
    transition: { duration: 0.16, ease: 'easeIn' },
  }),
};

const ENTRY_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
  shown: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.36, ease: ENTER_EASE },
  },
  gone: { opacity: 0 },
};

const STILL_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.12 } },
  gone: { opacity: 0, transition: { duration: 0.08 } },
};

/**
 * One section of the site laid out under the bar: a short word on what the section is for, then
 * every place in it. It slides in from the side the pointer came from, so moving along the bar
 * reads as moving along a row of sections rather than one panel being swapped for another. Every
 * section lays its places on the same number of rows, room for the longest, so the bar holds one
 * height while it moves between them.
 *
 * @param group - The section to lay out.
 * @param direction - Which way the pointer travelled to reach it: 1 rightward, -1 leftward, 0 for
 *   the first section opened.
 * @param onChoose - Called once a place is chosen, so the bar can close.
 * @param onMeasure - Told how tall the section is while it is the one being shown, and never while
 *   it is on its way out, so the bar grows to fit the section arriving rather than the one leaving.
 */
const NavPanel = ({ group, direction, onChoose, onMeasure }: NavPanelProps) => {
  const isStill = useReducedMotionConfig() === true;
  const isPresent = useIsPresent();
  const { measureRef, height } = useFitHeight();

  useLayoutEffect(() => {
    if (isPresent && height !== null) {
      onMeasure(height);
    }
  }, [height, isPresent, onMeasure]);

  const { clear, containerRef, follow, moveTo, rect } = useSlidingHighlight();
  const sectionVariants = isStill ? STILL_VARIANTS : SECTION_VARIANTS;
  const entryVariants = isStill ? STILL_VARIANTS : ENTRY_VARIANTS;

  return (
    <motion.section
      ref={measureRef}
      aria-label={group.label}
      custom={direction}
      variants={sectionVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className="col-start-1 row-start-1 grid grid-cols-[minmax(11rem,15rem)_minmax(0,1fr)] gap-x-10 gap-y-4 self-start pb-7 pt-6 xl:gap-x-16"
    >
      <motion.div variants={entryVariants} className="flex flex-col gap-3 pt-3">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-text-muted">
          {group.eyebrow}
        </p>
        <p className="text-pretty text-[0.9375rem] leading-relaxed text-text">{group.blurb}</p>
      </motion.div>

      <div
        ref={containerRef}
        className="relative grid content-start gap-x-4 gap-y-1 md:grid-cols-2 md:grid-rows-[repeat(4,minmax(5.5rem,auto))] xl:grid-cols-3 xl:grid-rows-[repeat(3,minmax(5.5rem,auto))]"
        onPointerMove={follow}
        onPointerLeave={clear}
      >
        <HoverHighlight rect={rect} radius="md" />
        {group.items.map((item) => (
          <motion.div key={item.label} variants={entryVariants} className="grid">
            <NavEntry
              item={item}
              size="panel"
              onChoose={onChoose}
              onAim={() => {
                moveTo(item.label);
              }}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

NavPanel.displayName = 'NavPanel';

export { NavPanel };

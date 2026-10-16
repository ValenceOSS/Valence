import { useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { useFitWidth } from '@ValenceUI/useFitWidth';
import { cn } from '@ValenceUI/cn';
import { letterArrival, openSpring } from '@ValenceUI/animations/reveal';
import type { WordRevealProps } from './WordReveal.types';

const LETTER_STEP = 0.035;

/**
 * A word that opens out beside whatever stands before it once it is told to, the room for it
 * springing open and its letters rising into place one after another. Hidden from screen readers,
 * since what it spells is said once elsewhere.
 *
 * @param word - The word.
 * @param isShown - Whether it has opened yet.
 * @param hasArrived - Whether it was already open before this was drawn, so it is simply there.
 * @param className - Extra classes for the room it opens into.
 * @param wordClassName - Extra classes for the lettering.
 */
const WordReveal = ({
  word,
  isShown,
  hasArrived = false,
  className,
  wordClassName,
}: WordRevealProps) => {
  const isStill = useReducedMotionConfig() === true || hasArrived;
  const wordRef = useRef<HTMLSpanElement | null>(null);
  const wordWidth = useFitWidth(wordRef);

  return (
    <motion.span
      aria-hidden
      className={cn('flex overflow-hidden', className)}
      initial={isStill ? false : { width: 0 }}
      animate={{ width: isShown ? (wordWidth ?? 0) : 0 }}
      transition={openSpring}
    >
      <span
        ref={wordRef}
        className={cn(
          'flex whitespace-pre font-sans font-medium tracking-tight text-text',
          wordClassName,
        )}
      >
        {[...word].map((letter, at) => (
          <motion.span
            key={`${letter}-${at.toString()}`}
            className="inline-block"
            {...(isShown
              ? letterArrival(0.08 + at * LETTER_STEP, isStill)
              : { initial: isStill ? false : { opacity: 0, y: 8 } })}
          >
            {letter}
          </motion.span>
        ))}
      </span>
    </motion.span>
  );
};

WordReveal.displayName = 'WordReveal';

export { WordReveal };

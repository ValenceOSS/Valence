import { useEffect, useRef, useState } from 'react';
import { useFitWidth } from '@ValenceUI/useFitWidth';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Logo } from '@ValenceUI/Logo';
import {
  letterArrival,
  liquidSpring,
  openSpring,
  stillTransition,
} from '@ValenceUI/animations/reveal';
import type { BrandMarkProps } from './BrandMark.types';
import { say } from '@ValenceI18n/say';

const WORD = say('common.valence');

const LETTER_STEP = 0.035;

/**
 * The mark at the start of the bar, and the name beside it. The mark flies here from whatever screen
 * held it while the app was getting ready; only once it has landed does the name write itself in, the
 * space for it springing open from the mark and each letter rising into place after the one before.
 * Where the mark had nowhere to fly from, the name follows as soon as the bar is up. Once written it
 * stays, and for somebody who asked for less motion it is simply there.
 *
 * @param hasMark - Whether the bar draws the mark itself, rather than leaving room for one still on
 *   its way from a screen held over the app.
 * @param marksPlace - The name the mark travels under, shared with the screen it flies from.
 */
const BrandMark = ({ hasMark, marksPlace }: BrandMarkProps) => {
  const isStill = useReducedMotionConfig() === true;
  const wordRef = useRef<HTMLSpanElement | null>(null);
  const wordWidth = useFitWidth(wordRef);
  const [hasLanded, setHasLanded] = useState(isStill);
  const isFlyingRef = useRef(false);

  useEffect(() => {
    if (!hasMark || hasLanded) {
      return;
    }

    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (!isFlyingRef.current) {
          setHasLanded(true);
        }
      });
    });

    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [hasMark, hasLanded]);

  return (
    <>
      {hasMark ? (
        <motion.span
          layoutId={marksPlace}
          transition={{ layout: isStill ? stillTransition : liquidSpring }}
          onLayoutAnimationStart={() => {
            isFlyingRef.current = true;
          }}
          onLayoutAnimationComplete={() => {
            isFlyingRef.current = false;
            setHasLanded(true);
          }}
          className="flex items-center"
        >
          <Logo size={28} isSolid />
        </motion.span>
      ) : (
        <span aria-hidden className="flex items-center opacity-0">
          <Logo size={28} isSolid />
        </span>
      )}

      <span className="sr-only">{WORD}</span>

      <motion.span
        aria-hidden
        className="hidden overflow-hidden sm:flex"
        initial={isStill ? false : { width: 0 }}
        animate={{ width: hasLanded ? (wordWidth ?? 0) : 0 }}
        transition={openSpring}
      >
        <span
          ref={wordRef}
          className="flex whitespace-pre pl-2.5 font-sans text-xl font-medium tracking-tight text-text"
        >
          {[...WORD].map((letter, at) => (
            <motion.span
              key={`${letter}-${at.toString()}`}
              className="inline-block"
              {...(hasLanded
                ? letterArrival(0.08 + at * LETTER_STEP, isStill)
                : { initial: isStill ? false : { opacity: 0, y: 8 } })}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      </motion.span>
    </>
  );
};

BrandMark.displayName = 'BrandMark';

export { BrandMark };

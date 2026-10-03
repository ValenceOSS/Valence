import { useEffect, useRef, useState } from 'react';
import { useFitWidth } from '@ValenceUI/useFitWidth';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Logo } from '@ValenceUI/Logo';
import { cn } from '@ValenceUI/cn';
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

const LOOKS = {
  md: { mark: 28, word: 'pl-2.5 text-xl' },
  sm: { mark: 24, word: 'pl-2 text-base' },
} as const;

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
 * @param size - How large the mark and name are drawn: the bar's, or the smaller one a sidebar wants.
 */
const BrandMark = ({ hasMark, marksPlace, size = 'md' }: BrandMarkProps) => {
  const look = LOOKS[size];
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
          <Logo size={look.mark} isSolid />
        </motion.span>
      ) : (
        <span aria-hidden className="flex items-center opacity-0">
          <Logo size={look.mark} isSolid />
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
          className={cn(
            'flex whitespace-pre font-sans font-medium tracking-tight text-text',
            look.word,
          )}
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

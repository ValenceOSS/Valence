import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Logo } from '@ValenceUI/Logo';
import { WordReveal } from '@ValenceUI/WordReveal';
import { liquidSpring, stillTransition } from '@ValenceUI/animations/reveal';
import type { BrandMarkProps } from './BrandMark.types';
import { say } from '@ValenceI18n/say';

const WORD = say('common.valence');

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

      <WordReveal
        word={WORD}
        isShown={hasLanded}
        className="hidden sm:flex"
        wordClassName={look.word}
      />
    </>
  );
};

BrandMark.displayName = 'BrandMark';

export { BrandMark };

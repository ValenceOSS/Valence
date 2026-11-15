import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { CyclingWordProps } from './CyclingWord.types';

const SWAP = { duration: 0.5, ease: [0.65, 0, 0.35, 1] } as const;

const LETTER_STEP = 0.035;

const LETTER = {
  below: { y: '1.5em' },
  shown: { y: 0 },
  above: { y: '-1.5em' },
} as const;

/**
 * One word, in the brand colour, that gives way to the next in turn, its letters sliding up out
 * of its line one after another as the next word's letters slide up into it, round and round; held on the first for anybody who asked
 * for stillness.
 *
 * @param words - The words it turns through, in order.
 * @param staysMs - How long each word stays before the next takes its place.
 * @param isStill - Whether to hold on the first word rather than turn.
 */
const CyclingWord = ({ words, staysMs, isStill }: CyclingWordProps) => {
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (isStill || words.length < 2) {
      return undefined;
    }

    const timer = setInterval(() => {
      setAt((was) => (was + 1) % words.length);
    }, staysMs);

    return () => {
      clearInterval(timer);
    };
  }, [isStill, staysMs, words.length]);

  const word = words[isStill ? 0 : at] ?? '';

  return (
    <span className="relative -my-[0.15em] inline-flex overflow-x-visible overflow-y-clip py-[0.15em] text-accent">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={word}
          initial="below"
          animate="shown"
          exit="above"
          variants={{
            below: {},
            shown: { transition: { staggerChildren: LETTER_STEP } },
            above: { transition: { staggerChildren: LETTER_STEP } },
          }}
          className="inline-flex"
        >
          {[...word].map((letter, place) => (
            <motion.span
              key={`${letter}-${place.toString()}`}
              variants={LETTER}
              transition={SWAP}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

CyclingWord.displayName = 'CyclingWord';

export { CyclingWord };

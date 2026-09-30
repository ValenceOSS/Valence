import { useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { useFitWidth } from '@ValenceUI/useFitWidth';
import { letterArrival, openSpring, popSpring } from '@ValenceUI/animations/reveal';
import type { AccountFaceProps } from './AccountFace.types';

const OPENS_AFTER = 0.3;

const LETTER_STEP = 0.03;

/**
 * The face on the account control, with the name of whoever is watching beside it. When the page
 * opens the face pops in, the pill springs open out of it, and the name rises into place a letter at
 * a time, so the control arrives as a small moment rather than all at once; for somebody who asked for
 * less motion it is simply there. The name is never cut short with an ellipsis.
 *
 * @param avatar - The face.
 * @param name - The name to draw beside it, or none for the face alone.
 */
const AccountFace = ({ avatar, name }: AccountFaceProps) => {
  const isStill = useReducedMotionConfig() === true;
  const nameRef = useRef<HTMLSpanElement | null>(null);
  const nameWidth = useFitWidth(nameRef);

  return (
    <span className="flex items-center">
      <motion.span
        data-face-lands
        className="flex [html[data-face-arriving]_&]:opacity-0"
        initial={isStill ? false : { scale: 0.4, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={popSpring}
      >
        {avatar}
      </motion.span>

      {name === undefined ? null : (
        <motion.span
          className="flex overflow-hidden"
          initial={isStill ? false : { width: 0 }}
          animate={{ width: nameWidth ?? 0 }}
          transition={{ ...openSpring, delay: OPENS_AFTER }}
        >
          <span className="sr-only">{name}</span>

          <span
            ref={nameRef}
            aria-hidden
            className="flex whitespace-pre pl-2 pr-2.5 text-sm font-medium text-text"
          >
            {[...name].map((letter, at) => (
              <motion.span
                key={`${letter}-${at.toString()}`}
                className="inline-block"
                {...letterArrival(OPENS_AFTER + 0.12 + at * LETTER_STEP, isStill)}
              >
                {letter}
              </motion.span>
            ))}
          </span>
        </motion.span>
      )}
    </span>
  );
};

AccountFace.displayName = 'AccountFace';

export { AccountFace };

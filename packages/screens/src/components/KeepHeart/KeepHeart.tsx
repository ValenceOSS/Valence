import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Heart as HeartIcon } from '@keyline-icons/react';
import { Heart as HeartFilledIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import type { KeepHeartProps } from './KeepHeart.types';

/**
 * The heart on a keep button. Keeping something makes it jump and throw off a ring, so the press
 * lands as a moment rather than a swapped icon; letting go of it just settles back. Nothing moves
 * when it first appears, only when it changes, and nothing moves at all for somebody who asked for
 * less motion.
 *
 * @param isKept - Whether the thing is kept.
 * @param size - How large to draw the heart.
 */
const KeepHeart = ({ isKept, size }: KeepHeartProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <span className="relative inline-flex">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={isKept ? 'kept' : 'loose'}
          className="inline-flex"
          initial={isStill ? false : isKept ? { scale: 0.4 } : { scale: 0.8 }}
          animate={isStill ? { scale: 1 } : isKept ? { scale: [0.4, 1.35, 0.92, 1] } : { scale: 1 }}
          transition={
            isKept
              ? { duration: 0.45, times: [0, 0.45, 0.75, 1], ease: 'easeOut' }
              : { type: 'spring', stiffness: 500, damping: 30 }
          }
        >
          <Icon of={HeartIcon} whenActive={HeartFilledIcon} isActive={isKept} size={size} />
        </motion.span>
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isKept && !isStill ? (
          <motion.span
            key="ring"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-current"
            initial={{ scale: 0.6, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ) : null}
      </AnimatePresence>
    </span>
  );
};

KeepHeart.displayName = 'KeepHeart';

export { KeepHeart };

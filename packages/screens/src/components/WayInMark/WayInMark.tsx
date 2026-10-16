import { motion, useReducedMotionConfig } from 'motion/react';
import { Logo } from '@ValenceUI/Logo';
import { cn } from '@ValenceUI/cn';
import { liquidSpring, stillTransition } from '@ValenceUI/animations/reveal';
import type { WayInMarkProps } from './WayInMark.types';

const OURS = 'valence';

const MARKS_PLACE = 'valence-mark';

/**
 * Valence's mark on the way in, or the server's own name where it goes by another, carried from
 * one screen of the way in to the next — the wall of faces, the password, who is watching — and on
 * to the bar, so it reads as one mark moving rather than one vanishing and another appearing.
 *
 * @param name - What this server calls itself.
 * @param isSmall - Whether it sits small above something, rather than filling the screen alone.
 * @param className - Extra classes for where the caller places it.
 */
const WayInMark = ({ name, isSmall, className }: WayInMarkProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <motion.p
      layoutId={MARKS_PLACE}
      initial={{ opacity: 0, scale: prefersReducedMotion === true ? 1 : 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.7, ease: 'easeOut' },
        scale: { duration: 0.7, ease: 'easeOut' },
        layout: prefersReducedMotion === true ? stillTransition : liquidSpring,
      }}
      className={cn('flex items-center gap-1', className)}
    >
      {name.toLowerCase() === OURS ? (
        <Logo size={isSmall ? 44 : 128} isSolid label={name} />
      ) : (
        <span
          className={cn(
            'bg-gradient-to-br from-text via-text to-accent bg-clip-text font-semibold',
            'tracking-[-0.05em] text-transparent',
            isSmall ? 'text-[clamp(1.75rem,4vw,2.5rem)]' : 'text-[clamp(3rem,12vw,7rem)]',
          )}
        >
          {name}
        </span>
      )}
    </motion.p>
  );
};

WayInMark.displayName = 'WayInMark';

export { WayInMark };

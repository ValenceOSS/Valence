import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import type { CoverGlowProps } from './CoverGlow.types';

const DISSOLVING = { duration: 0.9, ease: 'easeInOut' } as const;

const STILL = { duration: 0.18, ease: 'easeOut' } as const;

/**
 * The light a song's cover gives off: the cover itself, blown up and blurred until only its
 * colours are left, darkened enough that white words stand on it. A new cover dissolves in over
 * the last one rather than switching, so moving to the next song shifts the light rather than
 * cutting it.
 *
 * @param src - The cover, or nothing to leave only the dark.
 * @param className - Where it sits, which is usually over the whole of whatever it lights.
 */
const CoverGlow = ({ src, className }: CoverGlowProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <div aria-hidden className={cn('pointer-events-none overflow-hidden bg-shade', className)}>
      <AnimatePresence initial={false}>
        {src === null ? null : (
          <motion.img
            key={src}
            src={src}
            alt=""
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion === true ? STILL : DISSOLVING}
            className="absolute inset-0 size-full scale-125 object-cover blur-3xl saturate-150"
          />
        )}
      </AnimatePresence>
      <span className="absolute inset-0 bg-shade/45" />
    </div>
  );
};

CoverGlow.displayName = 'CoverGlow';

export { CoverGlow };

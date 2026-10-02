import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, stillTransition } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import type { FieldNoteProps } from './FieldNote.types';

/**
 * The line under a field: what is wanted, or what is wrong in its place. A change of words fades
 * one out and the next in, and the room they take grows or shrinks to fit rather than jumping, so
 * a form does not lurch as somebody types.
 *
 * @param id - What the field is described by.
 * @param children - What is wanted, where anything is said.
 * @param error - What is wrong, which takes the line's place.
 */
const FieldNote = ({ id, children, error }: FieldNoteProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const said = error ?? children ?? '';

  useLayoutEffect(() => {
    const held = inner.current;

    if (held === null || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const watcher = new ResizeObserver(() => {
      setHeight(held.offsetHeight);
    });

    watcher.observe(held);

    return () => {
      watcher.disconnect();
    };
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={revealTransition(prefersReducedMotion)}
      className="overflow-hidden"
    >
      <div ref={inner}>
        <AnimatePresence mode="wait" initial={false}>
          {said === '' ? null : (
            <motion.p
              key={said}
              id={id}
              {...(error === undefined ? {} : { role: 'alert' })}
              initial={{ opacity: 0, y: prefersReducedMotion === true ? 0 : -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={stillTransition}
              className={cn(
                'pt-0.5 text-sm',
                error === undefined ? 'text-text-muted' : 'text-destructive',
              )}
            >
              {said}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

FieldNote.displayName = 'FieldNote';

export { FieldNote };

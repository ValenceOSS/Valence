import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { settleTween } from '@ValenceUI/animations/reveal';
import type { StepTrailLinesProps } from './StepTrailLines.types';

const BEND = 'absolute w-[7px] border-[var(--surface-line)]';

const DOTS = {
  quiet: 'bg-[var(--surface-divider)]',
  current: 'bg-accent',
  failed: 'bg-danger',
} as const;

/**
 * What happened within one step of a trail, set in under it: the trail bends in from the step's
 * mark to a rail of small dots, one beside each line, and bends back out to the next step when there
 * is one. The newest line's dot is lit while the step is under way and a failure's is red. A line
 * that arrives later opens up at the foot, the rail growing down to it and its dot popping in.
 *
 * @param lines - The lines, oldest first.
 * @param hasNext - Whether another step follows, so the trail bends back out to it.
 * @param isSettled - Whether the trail has been shown before, so what changes now is new and moves.
 */
const StepTrailLines = ({ lines, hasNext, isSettled }: StepTrailLinesProps) => {
  const isStill = useReducedMotionConfig() === true;
  const isMoving = isSettled && !isStill;
  const flow = isStill ? { duration: 0 } : settleTween;

  return (
    <div className="relative pt-3 pb-3">
      <span
        aria-hidden
        className={cn(BEND, '-top-2 left-[11.5px] h-[17px] rounded-bl-[7px] border-b border-l')}
      />
      <span
        aria-hidden
        className={cn(BEND, 'top-2 left-[18px] h-[18px] rounded-tr-[7px] border-t border-r')}
      />
      {hasNext ? (
        <>
          <span
            aria-hidden
            className={cn(
              BEND,
              'bottom-[9px] left-[18px] h-[18px] rounded-br-[7px] border-b border-r',
            )}
          />
          <span
            aria-hidden
            className={cn(
              BEND,
              '-bottom-2 left-[11.5px] h-[18px] rounded-tl-[7px] border-t border-l',
            )}
          />
        </>
      ) : null}

      <ol className="flex flex-col">
        <AnimatePresence initial={false}>
          {lines.map((line, at) => (
            <motion.li
              key={line.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={flow}
              className="relative"
            >
              {at < lines.length - 1 || hasNext ? (
                <motion.span
                  aria-hidden
                  initial={isMoving ? { scaleY: 0 } : false}
                  animate={{ scaleY: 1 }}
                  transition={flow}
                  className={cn(
                    'absolute left-[24px] top-[14px] w-px origin-top bg-[var(--surface-line)]',
                    at < lines.length - 1 ? 'h-full' : 'bottom-[15px]',
                  )}
                />
              ) : null}
              <motion.span
                aria-hidden
                initial={isMoving ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={isStill ? { duration: 0 } : { ...settleTween, delay: 0.15 }}
                className={cn(
                  'absolute left-[21.5px] top-[11px] size-1.5 rounded-full transition-colors duration-300',
                  DOTS[line.mark],
                )}
              />
              <motion.span
                initial={isMoving ? { y: 8 } : false}
                animate={{ y: 0 }}
                transition={flow}
                className="flex min-h-7 py-1 pl-10 text-sm leading-5 text-text-muted"
              >
                <span className="min-w-0 flex-1">{line.content}</span>
              </motion.span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
};

StepTrailLines.displayName = 'StepTrailLines';

export { StepTrailLines };

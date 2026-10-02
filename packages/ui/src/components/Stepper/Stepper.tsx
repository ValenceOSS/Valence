import { useId } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Check as CheckIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import {
  popArrival,
  revealItemVariants,
  revealTransition,
  settleTween,
  staggerVariants,
} from '@ValenceUI/animations/reveal';
import type { StepperProps } from './Stepper.types';
import { say } from '@ValenceI18n/say';

/**
 * Shows where somebody is in a flow of several steps, its steps arriving one after another when it
 * is first shown: each step by name, those already done ticked
 * as they are left, the line between them filling as the flow moves on, and the step they are on
 * picked out by a mark that slides to it. Folded, it is the step's number and name over a bar of
 * segments filling in turn, which is what it becomes on a narrow screen.
 *
 * @param label - What the flow is, for assistive technology.
 * @param steps - The steps, in order.
 * @param current - The step being shown.
 * @param shape - Whether it lists the steps, folds into a bar, or lists them only where there is
 *   room for it.
 * @param className - Extra classes for the caller's own layout.
 */
const Stepper = ({ label, steps, current, shape = 'fits', className }: StepperProps) => {
  const markId = useId();
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === current),
  );
  const shown = steps[index];
  const travel = revealTransition(prefersReducedMotion);
  const fill = isStill ? { duration: 0 } : settleTween;

  return (
    <nav aria-label={label} className={className}>
      <div
        className={cn(
          'flex-col gap-3',
          shape === 'list' ? 'hidden' : shape === 'bar' ? 'flex' : 'flex lg:hidden',
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
            {say('common.stepNumberOfTotal', {
              number: (index + 1).toString(),
              total: steps.length.toString(),
            })}
          </span>

          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={shown?.id}
              initial={{ opacity: 0, y: isStill ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isStill ? 0 : -6 }}
              transition={fill}
              className="truncate text-sm font-medium text-text"
            >
              {shown?.label}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex gap-1.5">
          {steps.map((step, at) => (
            <span
              key={step.id}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-track"
            >
              <motion.span
                className={cn(
                  'absolute inset-0 origin-left rounded-full',
                  at === index ? 'bg-accent' : 'bg-text/70',
                )}
                initial={false}
                animate={{ scaleX: at <= index ? 1 : 0 }}
                transition={fill}
              />
            </span>
          ))}
        </div>
      </div>

      <motion.ol
        variants={staggerVariants}
        initial="hidden"
        animate="shown"
        className={cn(
          'flex-col',
          shape === 'list' ? 'flex' : shape === 'bar' ? 'hidden' : 'hidden lg:flex',
        )}
      >
        {steps.map((step, at) => {
          const isDone = at < index;
          const isCurrent = at === index;

          return (
            <motion.li
              key={step.id}
              custom={at}
              variants={revealItemVariants(prefersReducedMotion)}
              aria-current={isCurrent ? 'step' : undefined}
              className="relative flex items-start gap-3.5 px-3 py-2.5"
            >
              {isCurrent ? (
                <motion.span
                  layoutId={markId}
                  className="absolute inset-0 rounded-xl bg-[var(--surface-hover)]"
                  transition={travel}
                />
              ) : null}

              {at === steps.length - 1 ? null : (
                <span
                  aria-hidden="true"
                  className="absolute left-[1.5rem] top-[2.375rem] h-[calc(100%-1.75rem)] w-px overflow-hidden bg-[var(--surface-line)]"
                >
                  <motion.span
                    className="absolute inset-0 origin-top bg-text/50"
                    initial={false}
                    animate={{ scaleY: isDone ? 1 : 0 }}
                    transition={fill}
                  />
                </span>
              )}

              <span
                className={cn(
                  'relative flex size-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold tabular-nums',
                  'transition-colors duration-300',
                  isCurrent
                    ? 'bg-accent text-accent-contrast'
                    : isDone
                      ? 'bg-text text-background'
                      : 'text-text-muted ring-1 ring-inset ring-[var(--surface-divider)]',
                )}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {isDone ? (
                    <motion.span key="done" className="flex" {...popArrival(0.05, isStill)}>
                      <Icon of={CheckIcon} size={13} label={say('common.done')} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="number"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={fill}
                    >
                      {(at + 1).toString()}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              <span className="relative flex min-w-0 flex-col gap-0.5">
                <span
                  className={cn(
                    'text-sm font-medium leading-6 transition-colors duration-300',
                    isCurrent ? 'text-text' : isDone ? 'text-text/80' : 'text-text-muted',
                  )}
                >
                  {step.label}
                </span>

                {step.detail === undefined ? null : (
                  <span className="text-xs leading-snug text-text-muted">{step.detail}</span>
                )}
              </span>
            </motion.li>
          );
        })}
      </motion.ol>
    </nav>
  );
};

Stepper.displayName = 'Stepper';

export { Stepper };

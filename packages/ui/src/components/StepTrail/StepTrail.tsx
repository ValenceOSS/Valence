import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { settleTween } from '@ValenceUI/animations/reveal';
import { StepTrailLines } from './components/StepTrailLines/StepTrailLines';
import { StepTrailMark } from './components/StepTrailMark/StepTrailMark';
import { StepTrailWords } from './components/StepTrailWords/StepTrailWords';
import type { StepTrailAside, StepTrailProps, StepTrailStep } from './StepTrail.types';
import { sayCount } from '@ValenceI18n/sayCount';

const SHOWN_AT_FIRST = 6;

const STATE_TONES = {
  accent: 'text-accent',
  warning: 'text-highlight',
  danger: 'text-danger',
} as const;

const LABELS = {
  done: 'text-text/80',
  current: 'text-text',
  failed: 'text-text',
  waiting: 'text-text-muted',
  locked: 'text-text',
} as const;

/**
 * What sits at the end of a step's row: how long it took, a word for where it stands in its own
 * colour, or a small pill, its words sliding when they change.
 *
 * @param aside - Which of those, if any.
 * @returns The aside, or nothing.
 */
const asideOf = (aside: StepTrailAside | undefined) => {
  if (aside?.kind === 'badge') {
    return (
      <Badge tone={aside.tone} size="md">
        {aside.text}
      </Badge>
    );
  }

  return (
    <span
      className={cn(
        'shrink-0 text-sm tabular-nums transition-colors duration-300',
        aside === undefined || aside.kind === 'note'
          ? 'text-text-muted'
          : cn('font-medium', STATE_TONES[aside.tone]),
      )}
    >
      <StepTrailWords>{aside?.text ?? ''}</StepTrailWords>
    </span>
  );
};

/**
 * Whether the line from a step's mark down to the next is lit, which it is from a step that is
 * done into whatever follows.
 *
 * @param step - The step the line leaves.
 * @returns Whether it is lit.
 */
const isLit = (step: StepTrailStep) => step.mark === 'done';

/**
 * A run of steps down a single trail, each with a round status mark: done, failed, turning for the
 * one under way, and waiting for the rest, the name of the one under way shimmering. A step can say
 * how long it took, where it stands, or carry a small pill, and can hold lines of what happened
 * within it, set in under it on a rail of their own. A step keeps its place as the trail moves on,
 * so when its name or where it stands changes the words slide rather than the step being drawn
 * afresh. The step under way shows its lines; one that is done keeps them folded until its row is
 * pressed. A long trail shows only its latest steps until the earlier ones are asked for.
 *
 * @param label - What the trail is, for assistive technology.
 * @param steps - The steps, first first.
 * @param className - Extra classes for the caller's own layout.
 */
const StepTrail = ({ label, steps, className }: StepTrailProps) => {
  const isStill = useReducedMotionConfig() === true;
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const [isAll, setIsAll] = useState(false);
  const hidden = isAll ? 0 : Math.max(steps.length - SHOWN_AT_FIRST, 0);
  const shown = steps.slice(hidden);
  const [isSettled, setIsSettled] = useState(false);
  const motionOf = isStill ? { duration: 0 } : settleTween;

  useEffect(() => {
    setIsSettled(true);
  }, []);

  /**
   * Opens a step's lines, or folds them away again.
   *
   * @param id - The step.
   */
  const toggle = (id: string) => {
    setOpened((was) => {
      const next = new Set(was);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {hidden === 0 ? null : (
        <Button
          variant="subtle"
          size="none"
          onClick={() => {
            setIsAll(true);
          }}
          className="mb-1 flex items-center gap-4 rounded-lg py-1 text-sm"
        >
          <span aria-hidden className="flex w-6 justify-center">
            <Icon of={ChevronDownIcon} size={14} className="rotate-180" />
          </span>
          {sayCount('ui.stepTrail.showEarlierSteps', hidden)}
        </Button>
      )}

      <ol aria-label={label} className="flex flex-col">
        <AnimatePresence initial={false}>
          {shown.map((step, at) => {
            const lines = step.lines ?? [];
            const hasLines = lines.length > 0;
            const isOpen = hasLines && opened.has(step.id) !== (step.isOpenAtFirst === true);
            const hasNext = at < shown.length - 1;
            const row = (
              <>
                <StepTrailMark kind={step.mark} />
                <span
                  className={cn(
                    'flex min-w-0 flex-1 text-[0.9375rem] font-medium transition-colors duration-300',
                    LABELS[step.mark],
                  )}
                >
                  <StepTrailWords
                    className={step.mark === 'current' ? 'valence-shimmer-text' : undefined}
                  >
                    {step.label}
                  </StepTrailWords>
                </span>
                {asideOf(step.aside)}
              </>
            );

            return (
              <motion.li
                key={step.id}
                layout="position"
                initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                transition={motionOf}
                aria-current={step.mark === 'current' ? 'step' : undefined}
                className="relative flex flex-col"
              >
                <AnimatePresence initial={false}>
                  {hasNext && !isOpen ? (
                    <motion.span
                      key="onward"
                      aria-hidden
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={motionOf}
                      className="absolute left-[11.5px] top-8 h-[calc(100%-1.5rem)] w-px overflow-hidden bg-[var(--surface-line)]"
                    >
                      <motion.span
                        className="absolute inset-0 origin-top bg-success/50"
                        initial={false}
                        animate={{ scaleY: isLit(step) ? 1 : 0 }}
                        transition={
                          isStill ? { duration: 0 } : { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
                        }
                      />
                    </motion.span>
                  ) : null}
                </AnimatePresence>

                {hasLines ? (
                  <Button
                    variant="bare"
                    size="none"
                    aria-expanded={isOpen}
                    onClick={() => {
                      toggle(step.id);
                    }}
                    className="flex min-h-10 w-full items-center gap-4 text-left"
                  >
                    {row}
                  </Button>
                ) : (
                  <div className="flex min-h-10 items-center gap-4">{row}</div>
                )}

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="lines"
                      initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transitionEnd: { overflow: 'visible' },
                      }}
                      exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                      transition={motionOf}
                    >
                      <StepTrailLines lines={lines} hasNext={hasNext} isSettled={isSettled} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
};

StepTrail.displayName = 'StepTrail';

export { StepTrail };

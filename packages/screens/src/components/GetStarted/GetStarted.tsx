import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import {
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  CircleCheck as CircleCheckIcon,
  CircleMinus as CircleMinusIcon,
} from '@keyline-icons/react/fill';
import { Circle as CircleIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { GetStartedProps, GetStartedStep } from './GetStarted.types';
import { say } from '@ValenceI18n/say';

const OPENS = { duration: 0.24, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * The first step in a list still to be done, which is the one held open for them.
 *
 * @param steps - The steps.
 * @returns The first one neither done nor skipped, where there is one.
 */
const firstOpen = (steps: GetStartedStep[]): GetStartedStep | undefined =>
  steps.find((step) => step.status === 'open');

/**
 * A short list of things worth doing in a new account, kept in the corner of the app rather than
 * a dialog in the way: a heading that folds the list away, named groups of steps with the group
 * still to finish open, and in it the next step open with a word on why and the way to do it, or to
 * skip it. Steps done are ticked and struck through, steps skipped are marked so, and the foot
 * counts how many are finished beside a way to put the list away for good.
 *
 * @param title - What the list is for.
 * @param sections - The groups of steps.
 * @param isCollapsed - Whether only the heading shows.
 * @param onCollapsedChange - Told to fold the list away or open it.
 * @param onSkip - Told a step was skipped.
 * @param onSkipAll - Told to put the list away for good.
 */
const GetStarted = ({
  title,
  sections,
  isCollapsed,
  onCollapsedChange,
  onSkip,
  onSkipAll,
}: GetStartedProps) => {
  const isStill = useReducedMotionConfig() === true;
  const steps = sections.flatMap((section) => section.steps);
  const finished = steps.filter((step) => step.status !== 'open').length;
  const unfinished = sections.find((section) => firstOpen(section.steps) !== undefined);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<string | null>(null);
  const shownSection = openSection ?? unfinished?.id ?? null;
  const transition = isStill ? { duration: 0 } : OPENS;

  return (
    <aside
      aria-label={title}
      className="fixed right-4 bottom-4 z-30 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[1.25rem] border border-[var(--surface-line)] bg-[var(--frame-panel)] text-text shadow-[var(--shadow-overlay)] [--card-shell:var(--frame-card)]"
    >
      <Button
        variant="bare"
        size="none"
        label={title}
        hasTooltip={false}
        onClick={() => {
          onCollapsedChange(!isCollapsed);
        }}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="font-sans text-base font-semibold">{title}</span>
        <span className="flex items-center gap-2 text-sm text-text-muted">
          {isCollapsed
            ? say('screens.getStarted.finishedOfTotal', { finished, total: steps.length })
            : null}
          <motion.span animate={{ rotate: isCollapsed ? 180 : 0 }} transition={transition}>
            <Icon of={ChevronDownIcon} size={16} />
          </motion.span>
        </span>
      </Button>

      <AnimatePresence initial={false}>
        {isCollapsed ? null : (
          <motion.div
            key="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            className="overflow-hidden"
          >
            <div className="flex max-h-[min(60vh,32rem)] flex-col overflow-y-auto border-t border-[var(--surface-line)] bg-[var(--card-shell)]">
              {sections.map((section) => {
                const isOpen = section.id === shownSection;
                const next = firstOpen(section.steps);
                const shownStep = openStep ?? next?.id ?? null;

                return (
                  <section
                    key={section.id}
                    className="border-b border-[var(--surface-line)] last:border-b-0"
                  >
                    <Button
                      variant="bare"
                      size="none"
                      label={section.title}
                      hasTooltip={false}
                      onClick={() => {
                        setOpenSection(isOpen ? '' : section.id);
                        setOpenStep(null);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-[0.9375rem] text-text-muted"
                    >
                      {section.title}
                      <Icon of={isOpen ? ChevronDownIcon : ChevronRightIcon} size={15} />
                    </Button>

                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.ul
                          key="steps"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={transition}
                          className="flex flex-col overflow-hidden px-2 pb-2"
                        >
                          {section.steps.map((step) => {
                            const isStepOpen = step.id === shownStep && step.status === 'open';

                            return (
                              <li
                                key={step.id}
                                className={cn(
                                  'rounded-[0.875rem] transition-colors duration-200',
                                  isStepOpen && 'bg-[var(--surface-hover)]',
                                )}
                              >
                                <Button
                                  variant="bare"
                                  size="none"
                                  label={step.title}
                                  hasTooltip={false}
                                  onClick={() => {
                                    setOpenStep(isStepOpen ? '' : step.id);
                                  }}
                                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                                >
                                  <span
                                    className={cn(
                                      'flex shrink-0',
                                      step.status === 'done'
                                        ? 'text-success'
                                        : step.status === 'skipped'
                                          ? 'text-text-muted'
                                          : 'text-text-muted',
                                    )}
                                  >
                                    <Icon
                                      of={
                                        step.status === 'done'
                                          ? CircleCheckIcon
                                          : step.status === 'skipped'
                                            ? CircleMinusIcon
                                            : CircleIcon
                                      }
                                      size={20}
                                    />
                                  </span>

                                  <span
                                    className={cn(
                                      'flex-1 text-[0.9375rem]',
                                      step.status === 'open'
                                        ? 'text-text'
                                        : 'text-text-muted line-through decoration-text-muted',
                                    )}
                                  >
                                    {step.title}
                                  </span>

                                  <span className="text-text-muted">
                                    <Icon
                                      of={isStepOpen ? ChevronDownIcon : ChevronRightIcon}
                                      size={14}
                                    />
                                  </span>
                                </Button>

                                <AnimatePresence initial={false}>
                                  {isStepOpen ? (
                                    <motion.div
                                      key="detail"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={transition}
                                      className="overflow-hidden"
                                    >
                                      <div className="flex flex-col gap-3 pr-3 pb-3.5 pl-11">
                                        <p className="font-body text-sm leading-snug text-text-muted">
                                          {step.description}
                                        </p>

                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={step.onAction}
                                          >
                                            {step.actionLabel}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              onSkip(step.id);
                                              setOpenStep(null);
                                            }}
                                          >
                                            {say('screens.getStarted.skip')}
                                          </Button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ) : null}
                                </AnimatePresence>
                              </li>
                            );
                          })}
                        </motion.ul>
                      ) : null}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--surface-line)] px-5 py-3 text-sm text-text-muted">
              <span>
                <span className="text-text">{finished}</span>
                {say('screens.getStarted.ofTotalCompleted', { total: steps.length })}
              </span>
              <Button variant="ghost" size="xs" onClick={onSkipAll}>
                {say('screens.getStarted.skipAll')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

GetStarted.displayName = 'GetStarted';

export { GetStarted };

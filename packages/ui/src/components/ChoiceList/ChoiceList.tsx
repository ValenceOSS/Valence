import { useId } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Check as CheckIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { revealTransition } from '@ValenceUI/animations/reveal';
import type { ChoiceListProps } from './ChoiceList.types';

/**
 * One of a few options to pick, each a row of its own with what it is, a line about it, and
 * whatever tells them apart at a glance on the right — a size, a price, a time.
 *
 * The row is the control: the whole of it is pressed to pick it, rather than a button tucked at the
 * end of each, and the one picked is ticked and tinted rather than outlined and labelled as well.
 * Read out as a set of radio buttons, since that is what it is. An option that can be seen but
 * not taken is shown dimmed and cannot be pressed, so what it would have been is still there to read.
 *
 * @param label - What is being chosen, read out to anybody who cannot see the rows.
 * @param choices - The options, in the order they are shown.
 * @param value - The one picked, or nothing yet.
 * @param onChoose - Told which one was pressed.
 * @param look - Rows down the page, or tiles side by side for a few weighty options, the one
 *   picked marked by a frame that slides to it.
 * @param className - Extra classes for the caller's own layout.
 */
const ChoiceList = ({
  label,
  choices,
  value,
  onChoose,
  look = 'rows',
  className,
}: ChoiceListProps) =>
  look === 'tiles' ? (
    <ChoiceTiles
      label={label}
      choices={choices}
      value={value}
      onChoose={onChoose}
      {...(className === undefined ? {} : { className })}
    />
  ) : (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-col gap-1.5', className)}>
      {choices.map((choice) => {
        const isChosen = choice.id === value;

        return (
          <Button
            key={choice.id}
            variant="row"
            size="none"
            role="radio"
            aria-checked={isChosen}
            disabled={choice.isDisabled === true}
            onClick={() => {
              onChoose(choice.id);
            }}
            className={cn(
              'items-center gap-3 rounded-xl border px-4 py-3',
              isChosen
                ? 'border-primary/50 bg-[var(--surface-hover)] hover:bg-[var(--surface-active)]'
                : 'border-[var(--surface-line)]',
              choice.isDisabled === true && 'opacity-50',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border',
                isChosen
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-[var(--surface-line)]',
              )}
            >
              {isChosen ? <Icon of={CheckIcon} size={12} /> : null}
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-text">
                {choice.title}

                {choice.note === undefined ? null : (
                  <Badge size="sm" tone="quiet">
                    {choice.note}
                  </Badge>
                )}
              </span>

              {choice.detail === undefined ? null : (
                <span className="line-clamp-2 text-xs text-text-muted">{choice.detail}</span>
              )}
            </span>

            {choice.aside === undefined ? null : (
              <span className="shrink-0 text-right">{choice.aside}</span>
            )}
          </Button>
        );
      })}
    </div>
  );

ChoiceList.displayName = 'ChoiceList';

/**
 * The options as tiles side by side, each its name and a line about it, the one picked framed and
 * ticked, the frame sliding from one to the next as the choice changes.
 *
 * @param label - What is being chosen.
 * @param choices - The options.
 * @param value - The one picked.
 * @param onChoose - Told which one was pressed.
 * @param className - Extra classes for the caller's own layout.
 */
const ChoiceTiles = ({
  label,
  choices,
  value,
  onChoose,
  className,
}: Omit<ChoiceListProps, 'look'>) => {
  const frameId = useId();
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('grid gap-2 sm:auto-cols-fr sm:grid-flow-col', className)}
    >
      {choices.map((choice) => {
        const isChosen = choice.id === value;

        return (
          <Button
            key={choice.id}
            variant="row"
            size="none"
            role="radio"
            aria-checked={isChosen}
            disabled={choice.isDisabled === true}
            onClick={() => {
              onChoose(choice.id);
            }}
            className={cn(
              'relative flex-col items-start gap-1.5 rounded-xl p-4 ring-1 ring-inset ring-[var(--surface-line)]',
              choice.isDisabled === true && 'opacity-50',
            )}
          >
            {isChosen ? (
              <motion.span
                layoutId={frameId}
                className="absolute inset-0 rounded-xl bg-[var(--surface-hover)] ring-1 ring-inset ring-primary/60"
                transition={revealTransition(prefersReducedMotion)}
              />
            ) : null}

            <span className="relative flex w-full items-center justify-between gap-2 text-sm font-semibold text-text">
              {choice.title}

              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full transition-colors',
                  isChosen
                    ? 'bg-primary text-primary-foreground'
                    : 'ring-1 ring-inset ring-[var(--surface-divider)]',
                )}
              >
                {isChosen ? <Icon of={CheckIcon} size={12} /> : null}
              </span>
            </span>

            {choice.detail === undefined ? null : (
              <span className="relative text-xs leading-relaxed text-text-muted">
                {choice.detail}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
};

ChoiceTiles.displayName = 'ChoiceTiles';

export { ChoiceList };

import { Check as CheckIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { ChoiceListProps } from './ChoiceList.types';

/**
 * One of a few options to pick, each a row of its own with what it is, a line about it, and
 * whatever tells them apart at a glance on the right — a size, a price, a time.
 *
 * The row is the control: the whole of it is pressed to pick it, rather than a button tucked at the
 * end of each, and the one picked is ticked and tinted rather than outlined and labelled as well.
 * Read out as a set of radio buttons, since that is what it is.
 *
 * @param label - What is being chosen, read out to anybody who cannot see the rows.
 * @param choices - The options, in the order they are shown.
 * @param value - The one picked, or nothing yet.
 * @param onChoose - Told which one was pressed.
 * @param className - Extra classes for the caller's own layout.
 */
const ChoiceList = ({ label, choices, value, onChoose, className }: ChoiceListProps) => (
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
          onClick={() => {
            onChoose(choice.id);
          }}
          className={cn(
            'items-center gap-3 rounded-xl border px-4 py-3',
            isChosen
              ? 'border-accent/60 bg-accent/10 hover:bg-accent/15'
              : 'border-[var(--surface-line)]',
          )}
        >
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full border',
              isChosen
                ? 'border-accent bg-accent text-accent-contrast'
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

export { ChoiceList };

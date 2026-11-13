import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import type { FaceChoiceProps } from './FaceChoice.types';

/**
 * One choice in a row of them in the face editor — a filter, a style of drawn face — shown as the
 * face itself in a small circle with its name beneath, ringed while it is the one chosen. It grows
 * and is faintly ringed under the pointer, and gives as it is pressed.
 *
 * @param label - What a reader is told choosing it does.
 * @param name - Its name, shown beneath it.
 * @param isChosen - Whether it is the one chosen.
 * @param isDisabled - Whether it cannot be chosen yet, drawn as an empty circle.
 * @param onChoose - Told it was chosen.
 * @param children - The face drawn as this choice would draw it.
 */
const FaceChoice = ({
  label,
  name,
  isChosen,
  isDisabled = false,
  onChoose,
  children,
}: FaceChoiceProps) => (
  <Button
    variant="bare"
    size="none"
    hasTooltip={false}
    label={label}
    isActive={!isDisabled && isChosen}
    disabled={isDisabled}
    className="group flex w-16 shrink-0 flex-col items-center gap-1.5"
    onClick={onChoose}
  >
    <span
      className={cn(
        'relative isolate block size-12 overflow-hidden rounded-full bg-subtle ring-2 ring-offset-2 ring-offset-surface',
        'transition-[transform,box-shadow] duration-150 ease-out still:transition-none',
        !isDisabled && 'group-hover:scale-105 group-active:scale-95 still:transform-none',
        !isDisabled && isChosen
          ? 'ring-primary'
          : cn('ring-transparent', !isDisabled && 'group-hover:ring-text/25'),
      )}
    >
      {isDisabled ? null : children}
    </span>
    <span
      className={cn(
        'whitespace-nowrap text-[0.65rem] transition-colors duration-150',
        !isDisabled && isChosen
          ? 'font-medium text-text'
          : cn('text-text-muted', !isDisabled && 'group-hover:text-text'),
      )}
    >
      {name}
    </span>
  </Button>
);

FaceChoice.displayName = 'FaceChoice';

export { FaceChoice };

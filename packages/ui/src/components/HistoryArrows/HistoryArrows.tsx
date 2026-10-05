import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { HistoryArrowsProps } from './HistoryArrows.types';

/**
 * Back and forward as one control split down the middle, the way a browser's pair sits at the top
 * of a window: two halves of one rounded shape, each lighting up on its own as the pointer reaches
 * it, and an arrow with nowhere to go drawn at half strength rather than taken away, so the pair
 * never changes width. Each names itself, with the keys that do the same, once the pointer rests.
 *
 * @param canGoBack - Whether there is anywhere to go back to.
 * @param canGoForward - Whether there is anywhere to go forward to.
 * @param onBack - Told to go back.
 * @param onForward - Told to go forward.
 * @param backLabel - What going back is called.
 * @param forwardLabel - What going forward is called.
 * @param backKeys - The keys that go back.
 * @param forwardKeys - The keys that go forward.
 * @param className - Extra classes for the caller's own layout.
 */
const HistoryArrows = ({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  backLabel,
  forwardLabel,
  backKeys,
  forwardKeys,
  className,
}: HistoryArrowsProps) => (
  <div className={cn('inline-flex rounded-md', className)}>
    <Button
      variant="ghost"
      size="none"
      isIconOnly
      label={backLabel}
      {...(backKeys === undefined ? {} : { shortcut: backKeys })}
      disabled={!canGoBack}
      onClick={onBack}
      className="h-6 w-7 rounded-l-md rounded-r-none"
    >
      <Icon of={ArrowLeftIcon} size={14} />
    </Button>

    <Button
      variant="ghost"
      size="none"
      isIconOnly
      label={forwardLabel}
      {...(forwardKeys === undefined ? {} : { shortcut: forwardKeys })}
      disabled={!canGoForward}
      onClick={onForward}
      className="h-6 w-7 rounded-l-none rounded-r-md"
    >
      <Icon of={ArrowRightIcon} size={14} />
    </Button>
  </div>
);

HistoryArrows.displayName = 'HistoryArrows';

export { HistoryArrows };

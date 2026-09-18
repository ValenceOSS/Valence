import { ArrowLeft01Icon, ArrowRight01Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import type { ReaderPickerProps } from './ReaderPicker.types';

/**
 * One place in a book to jump to — a page, a chapter, an entry in the contents — with a step either
 * side of it.
 *
 * What is chosen reads as a field, its name above its value, and opens into the whole list; the
 * arrows either side take one step without opening anything, which is how somebody mostly moves. An
 * arrow with nowhere to go is shown but cannot be pressed, so the row does not change shape at the
 * start and the end of a book.
 *
 * @param label - What is being chosen: a page, a chapter.
 * @param value - What is chosen now, as it should read.
 * @param options - Everything that could be chosen.
 * @param selectedId - Which of them is chosen.
 * @param onSelect - Told what was chosen from the list.
 * @param onPrevious - Takes one step back, where there is one.
 * @param onNext - Takes one step on, where there is one.
 * @param previousLabel - What stepping back is called, for anybody not looking at the arrow.
 * @param nextLabel - What stepping on is called.
 */
const ReaderPicker = ({
  label,
  value,
  options,
  selectedId,
  onSelect,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
}: ReaderPickerProps) => (
  <div className="flex items-stretch gap-2">
    <Button
      variant="secondary"
      isIconOnly
      label={previousLabel}
      disabled={onPrevious === undefined}
      className="h-auto shrink-0"
      onClick={onPrevious}
    >
      <Icon of={ArrowLeft01Icon} size={16} />
    </Button>

    <OptionMenu
      label={label}
      triggerShape="field"
      align="start"
      matchTriggerWidth
      className="h-auto min-w-0 flex-1 py-2"
      trigger={
        <>
          <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
            <span className="text-xs font-normal text-text-muted">{label}</span>
            <span className="max-w-full truncate text-sm text-text">{value}</span>
          </span>
          <Icon of={UnfoldMoreIcon} size={15} className="shrink-0 text-text-muted" />
        </>
      }
      groups={[{ name: label, selectedId, onSelect, options }]}
    />

    <Button
      variant="secondary"
      isIconOnly
      label={nextLabel}
      disabled={onNext === undefined}
      className="h-auto shrink-0"
      onClick={onNext}
    >
      <Icon of={ArrowRight01Icon} size={16} />
    </Button>
  </div>
);

ReaderPicker.displayName = 'ReaderPicker';

export { ReaderPicker };

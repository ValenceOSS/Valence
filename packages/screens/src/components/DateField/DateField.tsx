import { useState } from 'react';
import { Calendar as CalendarIcon } from '@keyline-icons/react';
import { localDayOf } from '@ValenceCore/functions/localDayOf';
import { formatCalendarDate } from '@ValenceCore/functions/formatCalendarDate';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { cn } from '@ValenceUI/cn';
import { FIELD_TEXT } from '@ValenceUI/tokens/FIELD_TEXT';
import { DayPickerPanel } from '@ValenceScreens/components/DayPickerPanel/DayPickerPanel';
import { say } from '@ValenceI18n/say';
import type { DateFieldProps } from './DateField.types';

/**
 * A date asked for in a form, drawn as a field like any other and picked from the same month the
 * release calendar opens: pressed, the month of the date it holds opens beneath it, turned a month
 * at a time, with ways to empty it or go straight to today, and it closes once a day is picked.
 *
 * @param label - What the date is.
 * @param value - The date it holds, as a year, month and day, or nothing.
 * @param onValueChange - Told the date picked, or nothing where it was emptied.
 * @param isLabelHidden - Whether the label is only read out, for a field labelled elsewhere.
 * @param isDisabled - Whether the date cannot be changed, such as where it is locked.
 * @param placeholder - What to show while it holds no date.
 * @param className - Extra classes for the caller's own layout.
 */
const DateField = ({
  label,
  value,
  onValueChange,
  isLabelHidden = false,
  isDisabled = false,
  placeholder,
  className,
}: DateFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const today = localDayOf();

  const pick = (day: string) => {
    setIsOpen(false);
    onValueChange(day);
  };

  return (
    <div data-slot="field" className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className={cn(FIELD_TEXT.label, isLabelHidden ? 'sr-only' : '')}>{label}</span>

      <PopoverPanel
        label={label}
        triggerLook="field"
        isDisabled={isDisabled}
        side="bottom"
        align="start"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        className="w-80"
        trigger={
          <>
            <span className={cn('truncate tabular-nums', value === '' ? 'text-text-muted' : '')}>
              {value === '' ? (placeholder ?? '') : formatCalendarDate(value)}
            </span>
            <Icon of={CalendarIcon} size={15} tone="muted" className="shrink-0" />
          </>
        }
      >
        <DayPickerPanel
          key={isOpen ? 'open' : 'shut'}
          picked={value === '' ? null : value}
          today={today}
          onPick={pick}
          footer={
            <span className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={value === ''}
                onClick={() => {
                  pick('');
                }}
              >
                {say('common.clear')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  pick(today);
                }}
              >
                {say('common.today')}
              </Button>
            </span>
          }
        />
      </PopoverPanel>
    </div>
  );
};

DateField.displayName = 'DateField';

export { DateField };

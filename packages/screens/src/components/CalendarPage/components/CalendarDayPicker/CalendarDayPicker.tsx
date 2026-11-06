import { useState } from 'react';
import { Calendar as CalendarIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { DayPickerPanel } from '@ValenceScreens/components/DayPickerPanel/DayPickerPanel';
import { say } from '@ValenceI18n/say';
import type { CalendarDayPickerProps } from './CalendarDayPicker.types';

/**
 * The button that turns the release calendar to any day: pressed, it opens a month to pick a day
 * from, turned a month at a time, with a way straight back to today. It opens on the month the
 * calendar is turned to, and closes once a day is picked.
 *
 * @param day - The day the calendar is turned to.
 * @param today - Today.
 * @param onPick - Told which day was picked.
 */
const CalendarDayPicker = ({ day, today, onPick }: CalendarDayPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const pick = (picked: string) => {
    setIsOpen(false);
    onPick(picked);
  };

  return (
    <PopoverPanel
      label={say('common.goToADay')}
      triggerLook="segment"
      side="bottom"
      align="end"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className="w-80"
      trigger={
        <>
          <Icon of={CalendarIcon} size={16} />
          {say('common.today')}
        </>
      }
    >
      <DayPickerPanel
        key={isOpen ? 'open' : 'shut'}
        picked={day}
        today={today}
        onPick={pick}
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              pick(today);
            }}
          >
            {say('common.today')}
          </Button>
        }
      />
    </PopoverPanel>
  );
};

CalendarDayPicker.displayName = 'CalendarDayPicker';

export { CalendarDayPicker };

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@keyline-icons/react';
import { addDays } from '@ValenceCore/functions/addDays';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { CalendarDayGrid } from '@ValenceScreens/components/CalendarPage/components/CalendarDayGrid/CalendarDayGrid';
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
  const [month, setMonth] = useState(day);
  const first = `${month.slice(0, 7)}-01`;

  const pick = (picked: string) => {
    setIsOpen(false);
    onPick(picked);
  };

  return (
    <PopoverPanel
      label={say('common.goToADay')}
      triggerLook="button"
      side="bottom"
      align="end"
      isOpen={isOpen}
      onOpenChange={(next) => {
        setIsOpen(next);

        if (next) {
          setMonth(day);
        }
      }}
      className="w-80"
      trigger={
        <>
          <Icon of={CalendarIcon} size={16} />
          {say('common.today')}
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 pl-2">
          <span className="text-sm font-semibold text-text">{nameTheMonth(month)}</span>
          <span className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              label={say('common.previous')}
              onClick={() => {
                setMonth(`${addDays(first, -1).slice(0, 7)}-01`);
              }}
            >
              <Icon of={ChevronLeftIcon} size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              label={say('common.next')}
              onClick={() => {
                setMonth(`${addDays(first, 31).slice(0, 7)}-01`);
              }}
            >
              <Icon of={ChevronRightIcon} size={16} />
            </Button>
          </span>
        </div>

        <CalendarDayGrid month={month} picked={day} today={today} onPick={pick} />

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            pick(today);
          }}
        >
          {say('common.today')}
        </Button>
      </div>
    </PopoverPanel>
  );
};

CalendarDayPicker.displayName = 'CalendarDayPicker';

export { CalendarDayPicker };

import { useState } from 'react';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@keyline-icons/react';
import { addDays } from '@ValenceCore/functions/addDays';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { CalendarDayGrid } from '@ValenceScreens/components/CalendarPage/components/CalendarDayGrid/CalendarDayGrid';
import { say } from '@ValenceI18n/say';
import type { DayPickerPanelProps } from './DayPickerPanel.types';

/**
 * A month to pick a day from, named across its top and turned a month at a time, opening on the
 * month of the day already picked or on this one where none is. Whatever goes beneath it, such as a
 * way straight to today, sits under the days.
 *
 * @param picked - The day picked, where one is.
 * @param today - Today.
 * @param onPick - Told which day was picked.
 * @param footer - What sits under the days.
 */
const DayPickerPanel = ({ picked, today, onPick, footer }: DayPickerPanelProps) => {
  const [month, setMonth] = useState(picked ?? today);
  const first = `${month.slice(0, 7)}-01`;

  return (
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

      <CalendarDayGrid month={month} picked={picked} today={today} onPick={onPick} />

      {footer}
    </div>
  );
};

DayPickerPanel.displayName = 'DayPickerPanel';

export { DayPickerPanel };

import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@keyline-icons/react';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { nameTheWeek } from '@ValenceClient/calendar/nameTheWeek';
import { Button } from '@ValenceUI/Button';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { CALENDAR_VIEWS } from '@ValenceScreens/calendar/CALENDAR_VIEWS';
import { CalendarDayPicker } from '@ValenceScreens/components/CalendarPage/components/CalendarDayPicker/CalendarDayPicker';
import { say } from '@ValenceI18n/say';
import type { CalendarToolbarProps } from './CalendarToolbar.types';

const VIEW_NAMES = {
  month: say('common.month'),
  week: say('common.week'),
  upcoming: say('common.upcoming'),
} as const;

/**
 * The bar across the top of the release calendar: which month or week it shows, the buttons that
 * turn it, the one that turns it to any day or back to today, the choice of view, and what to narrow
 * it to.
 *
 * The upcoming list always starts today, so it has nothing to turn.
 *
 * @param view - The view shown.
 * @param day - The day the calendar is turned to.
 * @param today - Today.
 * @param filters - What it can be narrowed by.
 * @param selected - What it is narrowed by.
 * @param onView - Shows another view.
 * @param onTurn - Turns it a page on, or back.
 * @param onPickDay - Turns it to a day picked, today among them.
 * @param onFilter - Narrows it.
 */
const CalendarToolbar = ({
  view,
  day,
  today,
  filters,
  selected,
  onView,
  onTurn,
  onPickDay,
  onFilter,
}: CalendarToolbarProps) => (
  <div className="flex flex-wrap items-center gap-3">
    <h1 className="mr-auto text-3xl font-semibold tracking-tight text-text">
      {view === 'month'
        ? nameTheMonth(day)
        : view === 'week'
          ? nameTheWeek(day)
          : say('common.upcoming')}
    </h1>

    {view === 'upcoming' ? null : (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('common.previous')}
          onClick={() => {
            onTurn(-1);
          }}
        >
          <Icon of={ChevronLeftIcon} size={18} />
        </Button>

        <CalendarDayPicker day={day} today={today} onPick={onPickDay} />

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('common.next')}
          onClick={() => {
            onTurn(1);
          }}
        >
          <Icon of={ChevronRightIcon} size={18} />
        </Button>
      </div>
    )}

    <SegmentedRow
      label={say('common.calendarViews')}
      size="sm"
      items={CALENDAR_VIEWS.map((id) => ({ id, label: VIEW_NAMES[id] }))}
      value={view}
      onSelect={(id) => {
        onView(CALENDAR_VIEWS.find((known) => known === id) ?? 'month');
      }}
    />

    <FilterMenu
      label={say('screens.calendarPage.narrowTheCalendar')}
      groups={filters}
      selected={selected}
      onChange={onFilter}
    />
  </div>
);

CalendarToolbar.displayName = 'CalendarToolbar';

export { CalendarToolbar };

import {
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@keyline-icons/react';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { nameTheSpan } from '@ValenceClient/calendar/nameTheSpan';
import { nameTheWeek } from '@ValenceClient/calendar/nameTheWeek';
import { Button } from '@ValenceUI/Button';
import { FilterSplit } from '@ValenceUI/FilterSplit';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { CALENDAR_VIEWS } from '@ValenceScreens/calendar/CALENDAR_VIEWS';
import { daysShownIn } from '@ValenceScreens/calendar/daysShownIn';
import { CalendarSubscribe } from '@ValenceScreens/components/CalendarSubscribe/CalendarSubscribe';
import { CalendarDayPicker } from '@ValenceScreens/components/CalendarPage/components/CalendarDayPicker/CalendarDayPicker';
import { say } from '@ValenceI18n/say';
import type { CalendarToolbarProps } from './CalendarToolbar.types';

const VIEW_NAMES = {
  timeline: say('common.timeline'),
  month: say('common.month'),
  week: say('common.week'),
  upcoming: say('common.upcoming'),
} as const;

const TURN_LOOK = cn(JOINED_LOOKS.segment, 'inline-flex items-center px-2.5');

/**
 * The bar across the top of the release calendar: which months, month or week it shows, the buttons that
 * turn it, the one that turns it to any day or back to today, the choice of view, the way to add it
 * to a calendar app, and what to narrow it to.
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
    <h2 className="mr-auto text-xl font-semibold tracking-tight text-text">
      {view === 'timeline'
        ? nameTheSpan(daysShownIn(view, day, today))
        : view === 'month'
          ? nameTheMonth(day)
          : view === 'week'
            ? nameTheWeek(day)
            : say('common.upcoming')}
    </h2>

    {view === 'upcoming' ? null : (
      <div className={JOINED_LOOKS.track}>
        <Button
          variant="bare"
          size="none"
          label={say('common.previous')}
          className={TURN_LOOK}
          onClick={() => {
            onTurn(-1);
          }}
        >
          <Icon of={ChevronLeftIcon} size={16} />
        </Button>

        <CalendarDayPicker day={day} today={today} onPick={onPickDay} />

        <Button
          variant="bare"
          size="none"
          label={say('common.next')}
          className={TURN_LOOK}
          onClick={() => {
            onTurn(1);
          }}
        >
          <Icon of={ChevronRightIcon} size={16} />
        </Button>
      </div>
    )}

    <div className={JOINED_LOOKS.track}>
      <OptionMenu
        label={say('common.calendarViews')}
        triggerShape="segment"
        align="end"
        groups={[
          {
            name: say('common.calendarViews'),
            options: CALENDAR_VIEWS.map((id) => ({ id, label: VIEW_NAMES[id] })),
            selectedId: view,
            onSelect: (id) => {
              onView(CALENDAR_VIEWS.find((known) => known === id) ?? 'timeline');
            },
          },
        ]}
        trigger={
          <>
            {VIEW_NAMES[view]}
            <Icon of={ChevronDownIcon} size={14} tone="muted" className="shrink-0" />
          </>
        }
      />
    </div>

    <div className={JOINED_LOOKS.track}>
      <CalendarSubscribe />
    </div>

    <FilterSplit
      label={say('screens.calendarPage.narrowTheCalendar')}
      groups={filters}
      selected={selected}
      onChange={onFilter}
    />
  </div>
);

CalendarToolbar.displayName = 'CalendarToolbar';

export { CalendarToolbar };

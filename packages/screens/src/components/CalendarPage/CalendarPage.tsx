import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Calendar as CalendarIcon } from '@keyline-icons/react';
import { localDayOf } from '@ValenceCore/functions/localDayOf';
import { calendarQueries } from '@ValenceClient/query/calendarQueries';
import { filterCalendar } from '@ValenceClient/calendar/filterCalendar';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { SEES_EVERY_REQUEST } from '@ValenceContracts/schemas/Permission';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import { RAIL } from '@ValenceUI/tokens/rail';
import { staggerVariants } from '@ValenceUI/animations/reveal';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { calendarViewShown } from '@ValenceScreens/calendar/calendarViewShown';
import { daysShownIn } from '@ValenceScreens/calendar/daysShownIn';
import { describeCalendarFilters } from '@ValenceScreens/calendar/describeCalendarFilters';
import { readCalendarFilters } from '@ValenceScreens/calendar/readCalendarFilters';
import { turnTheCalendar } from '@ValenceScreens/calendar/turnTheCalendar';
import { calendarPageTurn } from '@ValenceScreens/calendar/calendarPageTurn';
import { say } from '@ValenceI18n/say';
import { PageTitle } from '@ValenceScreens/components/PageTitle/PageTitle';
import { CalendarToolbar } from './components/CalendarToolbar/CalendarToolbar';
import { CalendarMonth } from './components/CalendarMonth/CalendarMonth';
import { CalendarTimeline } from './components/CalendarTimeline/CalendarTimeline';
import { CalendarMonthNarrow } from './components/CalendarMonthNarrow/CalendarMonthNarrow';
import { CalendarWeek } from './components/CalendarWeek/CalendarWeek';
import { CalendarUpcoming } from './components/CalendarUpcoming/CalendarUpcoming';
import { CalendarUpNext } from './components/CalendarUpNext/CalendarUpNext';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

const NOTHING_CHOSEN: ReadonlySet<string> = new Set();

/**
 * The release calendar: when episodes of shows in the library air, and when films and shows the
 * viewer asked for come out, as a timeline of five weeks, a month or a week at a time, or as a list of what is
 * coming.
 *
 * Which view and which day are kept in the address, so going back returns to them; what it is
 * narrowed to is kept on the page. Turning a page slides the next one in from the side turned
 * towards; changing the view lifts the new one into place.
 */
const CalendarPage = () => {
  const { place, go } = usePlace();
  const { may } = useWhatIMayDo();
  const [selected, setSelected] = useState<ReadonlySet<string>>(NOTHING_CHOSEN);
  const [direction, setDirection] = useState(0);
  const prefersReducedMotion = useReducedMotionConfig();
  const today = localDayOf();
  const view = calendarViewShown(place.calendarView);
  const day = place.calendarDay ?? today;
  const maySeeEveryone = SEES_EVERY_REQUEST.some(may);
  const { filter, who } = readCalendarFilters(selected, maySeeEveryone);
  const { from, to } = daysShownIn(view, day, today);
  const asked = useQuery(calendarQueries.releases(from, to, who));
  const entries = filterCalendar(asked.data ?? [], filter);
  const shown = asked.isError ? 'error' : asked.isPending ? 'reading' : `${view}:${from}`;

  const open = (entry: CalendarEntry) => {
    switch (entry.opens.kind) {
      case 'show':
        go({ show: entry.opens.showId });
        break;
      case 'item':
        go({ inspecting: entry.opens.mediaId });
        break;
      case 'asking':
        go({ asking: askingOf({ kind: entry.opens.requestKind, id: entry.opens.catalogueId }) });
        break;
    }
  };

  return (
    <motion.main
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className={cn(RAIL.lane, RAIL.inset, 'flex flex-col gap-6 pt-6 pb-16')}
    >
      <PageTitle>{say('common.calendar')}</PageTitle>

      <CalendarToolbar
        view={view}
        day={day}
        today={today}
        filters={describeCalendarFilters(maySeeEveryone)}
        selected={selected}
        onView={(next) => {
          setDirection(0);
          go({ calendarView: next, calendarDay: place.calendarDay });
        }}
        onTurn={(pages) => {
          setDirection(Math.sign(pages));
          go({ calendarDay: turnTheCalendar(view, day, pages), calendarView: place.calendarView });
        }}
        onPickDay={(picked) => {
          setDirection(Math.sign(picked.localeCompare(day)));
          go({
            calendarDay: picked === today ? null : picked,
            calendarView: place.calendarView,
          });
        }}
        onFilter={setSelected}
      />

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={shown}
          custom={direction}
          variants={calendarPageTurn(prefersReducedMotion)}
          initial="enter"
          animate="centre"
          exit="leave"
          className="flex flex-col gap-8"
        >
          {view === 'upcoming' || asked.isError || asked.isPending ? null : (
            <CalendarUpNext entries={entries} today={today} onOpen={open} />
          )}

          {asked.isError ? (
            <CouldNotRead
              said={say('screens.calendarPage.theCalendarCouldNotBeRead')}
              isTryingAgain={asked.isFetching}
              onTryAgain={() => {
                void asked.refetch();
              }}
            />
          ) : asked.isPending ? (
            <Spinner isPageCentered label={say('screens.calendarPage.readingTheCalendar')} />
          ) : view === 'timeline' ? (
            <CalendarTimeline day={day} today={today} entries={entries} onOpen={open} />
          ) : view === 'month' ? (
            <>
              <CalendarMonth
                day={day}
                today={today}
                entries={entries}
                onOpen={open}
                onOpenWeek={(date) => {
                  setDirection(0);
                  go({ calendarView: 'week', calendarDay: date });
                }}
              />
              <div className="xl:hidden">
                <CalendarMonthNarrow
                  day={day}
                  today={today}
                  entries={entries}
                  onOpen={open}
                  onPick={(date) => {
                    setDirection(Math.sign(date.slice(0, 7).localeCompare(day.slice(0, 7))));
                    go({ calendarDay: date, calendarView: place.calendarView });
                  }}
                />
              </div>
            </>
          ) : entries.length === 0 && !asked.isPlaceholderData ? (
            <NothingHere
              of={CalendarIcon}
              title={say('common.nothingComesOutOnTheseDays')}
              detail={say('common.episodesAndRequestsAppearHere')}
            />
          ) : view === 'week' ? (
            <CalendarWeek day={day} today={today} entries={entries} onOpen={open} />
          ) : (
            <CalendarUpcoming entries={entries} today={today} onOpen={open} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.main>
  );
};

CalendarPage.displayName = 'CalendarPage';

export { CalendarPage };

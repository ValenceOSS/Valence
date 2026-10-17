import { useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { InfoHeading } from '@ValenceUI/InfoHeading';
import { HoverCard } from '@ValenceUI/HoverCard';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { BusyHoursGridProps } from './BusyHoursGrid.types';

const A_MONDAY = Date.UTC(2024, 0, 1, 12);

const DAY_MS = 24 * 60 * 60 * 1000;

const TICKS = [0, 6, 12, 18];

const dayName = (weekday: number, width: 'short' | 'long') =>
  new Intl.DateTimeFormat(undefined, { weekday: width, timeZone: 'UTC' }).format(
    A_MONDAY + weekday * DAY_MS,
  );

const hourName = (hour: number) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', timeZone: 'UTC' }).format(
    Date.UTC(2024, 0, 1, hour),
  );

/**
 * When in the week the server is busiest: a row for each day from Monday and a cell for each hour,
 * darker the more was started then. Pointing at a cell opens a card saying which hour it is, how
 * much was started in it, who was watching and what; the busiest hour is said to anybody who cannot
 * see the grid.
 *
 * @param hours - How much was started in each hour, by day from Monday then hour from midnight.
 * @param detail - Who watched and what, for each hour anything was started in.
 * @param label - What the grid shows, read out with its busiest hour.
 * @param className - Extra classes for the caller's own layout.
 */
const BusyHoursGrid = ({ hours, detail = [], label, className }: BusyHoursGridProps) => {
  const [pointed, setPointed] = useState<{ day: number; hour: number } | null>(null);
  const most = Math.max(1, ...hours.flat());
  const busiest = hours
    .flatMap((row, day) => row.map((count, hour) => ({ day, hour, count })))
    .reduce((best, cell) => (cell.count > best.count ? cell : best), { day: 0, hour: 0, count: 0 });
  const shown = pointed ?? (busiest.count > 0 ? busiest : null);
  const shownCount = shown === null ? 0 : (hours[shown.day]?.[shown.hour] ?? 0);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        role="img"
        aria-label={
          busiest.count === 0
            ? label
            : say('screens.adminArea.busyHoursGrid.labelBusiest', {
                label,
                day: dayName(busiest.day, 'long'),
                hour: hourName(busiest.hour),
              })
        }
        className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1"
        onPointerLeave={() => {
          setPointed(null);
        }}
      >
        {hours.map((row, day) => (
          <div key={dayName(day, 'short')} className="contents">
            <span aria-hidden className="text-[0.6875rem] leading-4 text-text-muted">
              {dayName(day, 'short')}
            </span>

            <span aria-hidden className="grid grid-cols-24 gap-0.5">
              {row.map((count, hour) => {
                const isPointed = pointed?.day === day && pointed.hour === hour;
                const said = detail.find((one) => one.weekday === day && one.hour === hour);

                const cell = (
                  <span
                    onPointerEnter={() => {
                      setPointed({ day, hour });
                    }}
                    className={cn(
                      'block h-4 rounded-[3px] bg-text transition-opacity duration-150',
                      count === 0 ? 'opacity-[0.06]' : '',
                      isPointed ? 'ring-1 ring-text' : '',
                    )}
                    style={count === 0 ? undefined : { opacity: 0.15 + (count / most) * 0.75 }}
                  />
                );

                return count === 0 ? (
                  <span key={hourName(hour)}>{cell}</span>
                ) : (
                  <HoverCard
                    key={hourName(hour)}
                    isList
                    isBlock
                    openDelayMs={60}
                    side={day < 3 ? 'bottom' : 'top'}
                    align={hour < 6 ? 'start' : hour > 17 ? 'end' : 'center'}
                    className="min-w-56"
                    detail={
                      <>
                        <InfoHeading>
                          {say('screens.adminArea.busyHoursGrid.dayAtHour', {
                            day: dayName(day, 'long'),
                            hour: hourName(hour),
                          })}
                        </InfoHeading>
                        <span className="flex min-h-7 items-center justify-between gap-4 px-2.5">
                          <span className="text-text-muted">
                            {say('screens.importWizard.importReportView.plays')}
                          </span>
                          <span className="tabular-nums">{count.toLocaleString()}</span>
                        </span>
                        {said === undefined || said.viewers.length === 0 ? null : (
                          <span className="flex flex-col gap-0.5 px-2.5 py-1">
                            <span className="text-xs text-text-muted">
                              {say('common.watching')}
                            </span>
                            <span className="[overflow-wrap:anywhere]">
                              {said.viewers.join(', ')}
                            </span>
                          </span>
                        )}
                        {said === undefined || said.titles.length === 0 ? null : (
                          <span className="flex flex-col gap-0.5 px-2.5 py-1">
                            <span className="text-xs text-text-muted">
                              {say('screens.adminArea.busyHoursGrid.mostlyWatched')}
                            </span>
                            {said.titles.map((title) => (
                              <span key={title} className="truncate">
                                {title}
                              </span>
                            ))}
                          </span>
                        )}
                      </>
                    }
                  >
                    {cell}
                  </HoverCard>
                );
              })}
            </span>
          </div>
        ))}

        <span aria-hidden />

        <span aria-hidden className="relative h-3.5">
          {TICKS.map((hour) => (
            <span
              key={hour}
              className="absolute text-[0.6875rem] text-text-muted"
              style={{ left: `${((hour / 24) * 100).toString()}%` }}
            >
              {hourName(hour)}
            </span>
          ))}
        </span>
      </div>

      <p aria-live="polite" className="min-h-4 text-xs text-text-muted tabular-nums">
        {shown === null
          ? say('screens.adminArea.busyHoursGrid.nothingWasStarted')
          : say('screens.adminArea.busyHoursGrid.dayAtHourStarted', {
              day: dayName(shown.day, 'long'),
              hour: hourName(shown.hour),
              started: sayCount('screens.adminArea.busyHoursGrid.count.plays', shownCount),
            })}
      </p>
    </div>
  );
};

BusyHoursGrid.displayName = 'BusyHoursGrid';

export { BusyHoursGrid };

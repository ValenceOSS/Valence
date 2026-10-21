import { useMemo, useState } from 'react';
import { BarList } from '@ValenceUI/BarList';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { FreshnessNote } from '@ValenceUI/FreshnessNote';
import { Spinner } from '@ValenceUI/Spinner';
import { TimeBars } from '@ValenceUI/TimeBars';
import { Tooltip } from '@ValenceUI/Tooltip';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Statistics, StatisticsRange } from '@ValenceContracts/schemas/Statistics';
import { DashboardRegion } from '@ValenceScreens/components/DashboardRegion/DashboardRegion';
import { StatStrip } from '@ValenceScreens/components/AdminArea/components/StatStrip/StatStrip';
import { BusyHoursGrid } from '@ValenceScreens/components/AdminArea/components/BusyHoursGrid/BusyHoursGrid';
import { MostWatchedList } from '@ValenceScreens/components/AdminArea/components/MostWatchedList/MostWatchedList';
import { PlaybackModeShare } from '@ValenceScreens/components/AdminArea/components/PlaybackModeShare/PlaybackModeShare';
import { ConversionReasons } from '@ValenceScreens/components/AdminArea/components/ConversionReasons/ConversionReasons';
import { StatisticsRangeChoice } from '@ValenceScreens/components/AdminArea/components/StatisticsRangeChoice/StatisticsRangeChoice';
import { useStatistics } from '@ValenceScreens/admin/useStatistics';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { freshnessOf } from '@ValenceClient/query/freshnessOf';
import { useLookAgainWhenShown } from '@ValenceClient/query/useLookAgainWhenShown';
import { AdminPageActions } from '@ValenceScreens/components/AdminPage/components/AdminPageActions/AdminPageActions';
import { say } from '@ValenceI18n/say';
import type { StatisticsPanelProps } from './StatisticsPanel.types';

type ClientRow = Statistics['clients'][number];

const DAY_MS = 24 * 60 * 60 * 1000;

const atNoon = (day: string) => Date.parse(`${day}T12:00:00Z`);

const shortDay = (atMs: number) =>
  new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    atMs,
  );

/**
 * What the server has been used for over a range: how much was watched and by how many, which days
 * and hours were busiest, which titles and people watched most, how plays reached their devices and
 * why some had to be converted, on which devices, and how much arrived each week.
 *
 * @param onOpenPanel - Called with the panel to open, such as the sessions page.
 */
const StatisticsPanel = ({ onOpenPanel }: StatisticsPanelProps) => {
  const [range, setRange] = useState<StatisticsRange>('week');
  const asked = useStatistics(range);
  const statistics = asked.data;
  const isLookingAgain = useLookAgainWhenShown(true, [[...adminQueries.key, 'statistics', range]]);

  const clientColumns = useMemo<DataTableColumn<ClientRow>[]>(
    () => [
      {
        id: 'client',
        header: say('common.device'),
        accessorFn: (row) => row.client,
        cell: ({ row }) => (
          <Tooltip label={row.original.client}>
            <span className="block max-w-[min(22rem,50vw)] truncate font-medium text-text">
              {row.original.client === ''
                ? say('screens.adminArea.statisticsPanel.anUnknownDevice')
                : row.original.client}
            </span>
          </Tooltip>
        ),
      },
      {
        id: 'plays',
        header: say('screens.importWizard.importReportView.plays'),
        accessorFn: (row) => row.plays,
        cell: ({ row }) => <FormattedNumber value={row.original.plays} />,
      },
      {
        id: 'asItLies',
        meta: { hidesOnPhones: true },
        header: say('screens.adminArea.statisticsPanel.asTheFileLies'),
        accessorFn: (row) => row.modes.DirectPlay + row.modes.Remux,
        cell: ({ row }) => (
          <FormattedNumber
            value={(row.original.modes.DirectPlay + row.original.modes.Remux) / row.original.plays}
            format={{ style: 'percent' }}
          />
        ),
      },
      {
        id: 'converted',
        meta: { hidesOnPhones: true },
        header: say('screens.downloadDialog.converted'),
        accessorFn: (row) => row.modes.DirectStream + row.modes.Transcode,
        cell: ({ row }) => (
          <FormattedNumber value={row.original.modes.DirectStream + row.original.modes.Transcode} />
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <AdminPageActions>
        <FreshnessNote {...freshnessOf([asked], isLookingAgain)} />
        <StatisticsRangeChoice value={range} onChange={setRange} />
      </AdminPageActions>

      {asked.isLoadingError ? (
        <CouldNotRead
          said={say('screens.adminArea.statisticsPanel.theStatisticsCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : statistics === undefined ? (
        <Spinner
          isCentered
          size="sm"
          label={say('screens.adminArea.statisticsPanel.readingTheStatistics')}
        />
      ) : (
        <>
          <StatStrip
            stats={[
              {
                label: say('screens.importWizard.importReportView.plays'),
                value: <FormattedNumber value={statistics.totals.plays} />,
              },
              {
                label: say('screens.adminArea.statisticsPanel.hoursWatched'),
                value: <FormattedNumber value={statistics.totals.hours} />,
              },
              {
                label: say('screens.adminArea.statisticsPanel.peopleWatching'),
                value: <FormattedNumber value={statistics.totals.viewers} />,
              },
              {
                label: say('screens.adminArea.statisticsPanel.titlesWatched'),
                value: <FormattedNumber value={statistics.totals.titles} />,
              },
            ]}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DashboardRegion
              title={say('screens.adminArea.statisticsPanel.playsEachDay')}
              className="md:col-span-2"
            >
              <TimeBars
                label={say('screens.adminArea.statisticsPanel.playsEachDay')}
                bars={statistics.days.map((day) => ({
                  atMs: atNoon(day.day),
                  values: { plays: day.plays },
                }))}
                series={[
                  {
                    key: 'plays',
                    label: say('screens.importWizard.importReportView.plays'),
                    colour: 'var(--color-accent)',
                  },
                ]}
                bucketMs={DAY_MS}
                hasLegend={false}
                formatTick={shortDay}
              />
            </DashboardRegion>

            <DashboardRegion
              title={say('screens.adminArea.statisticsPanel.addedEachWeek')}
              className="md:col-span-2 lg:col-span-1"
            >
              <TimeBars
                label={say('screens.adminArea.statisticsPanel.addedEachWeek')}
                bars={statistics.added.map((week) => ({
                  atMs: atNoon(week.week),
                  values: { items: week.items },
                }))}
                series={[
                  {
                    key: 'items',
                    label: say('screens.adminArea.statisticsPanel.titlesAdded'),
                    colour: 'var(--color-success)',
                  },
                ]}
                bucketMs={7 * DAY_MS}
                hasLegend={false}
                formatTick={shortDay}
              />
            </DashboardRegion>

            <DashboardRegion
              title={say('screens.adminArea.statisticsPanel.busiestTimes')}
              className="md:col-span-2"
            >
              <BusyHoursGrid
                hours={statistics.busyHours}
                detail={statistics.busyDetail}
                label={say('screens.adminArea.statisticsPanel.busiestTimes')}
              />
            </DashboardRegion>

            <DashboardRegion
              title={say('screens.adminArea.mostWatchedList.mostWatched')}
              className="md:col-span-2 lg:col-span-1"
            >
              <MostWatchedList titles={statistics.topTitles} limit={5} />
            </DashboardRegion>

            <DashboardRegion
              title={say('screens.adminArea.statisticsPanel.howThingsPlayed')}
              action={say('common.sessions')}
              onAction={() => {
                onOpenPanel('activity');
              }}
            >
              <PlaybackModeShare modes={statistics.modes} />
            </DashboardRegion>

            <DashboardRegion
              title={say('screens.adminArea.playbackModeShare.whyPlaysWereConverted')}
            >
              <ConversionReasons reasons={statistics.reasons} />
            </DashboardRegion>

            <DashboardRegion
              title={say('screens.adminArea.statisticsPanel.mostActive')}
              className="md:col-span-2 lg:col-span-1"
            >
              <BarList
                label={say('screens.adminArea.statisticsPanel.mostActive')}
                heading={say('common.profile')}
                valueHeading={say('screens.importWizard.importReportView.plays')}
                emptyMessage={say('screens.adminArea.mostWatchedList.nothingWasWatched')}
                items={statistics.topViewers.slice(0, 5).map((viewer) => ({
                  id: viewer.profileId,
                  label:
                    viewer.name === ''
                      ? say('screens.adminArea.statisticsPanel.aRemovedProfile')
                      : viewer.name,
                  value: viewer.plays,
                  ...(viewer.hours > 0
                    ? {
                        detail: say('screens.adminArea.mostWatchedList.hours', {
                          hours: viewer.hours.toLocaleString(),
                        }),
                      }
                    : {}),
                }))}
              />
            </DashboardRegion>

            <DashboardRegion
              title={say('screens.adminArea.statisticsPanel.byDevice')}
              isFlush
              className="md:col-span-2 lg:col-span-3"
            >
              <DataTable
                label={say('screens.adminArea.statisticsPanel.byDevice')}
                columns={clientColumns}
                rows={[...statistics.clients]}
                getRowId={(row) => row.client}
                emptyMessage={say(
                  'screens.adminArea.playbackModeShare.nothingWasPlayedInThisRange',
                )}
              />
            </DashboardRegion>
          </div>
        </>
      )}
    </div>
  );
};

StatisticsPanel.displayName = 'StatisticsPanel';

export { StatisticsPanel };

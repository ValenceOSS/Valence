import { Spinner } from '@ValenceUI/Spinner';
import { DashboardRegion } from '@ValenceScreens/components/DashboardRegion/DashboardRegion';
import { NeedsYouCard } from '@ValenceScreens/components/AdminArea/components/NeedsYouCard/NeedsYouCard';
import { WhatsNewCard } from '@ValenceScreens/components/AdminArea/components/WhatsNewCard/WhatsNewCard';
import { MostWatchedList } from '@ValenceScreens/components/AdminArea/components/MostWatchedList/MostWatchedList';
import { PlaybackModeShare } from '@ValenceScreens/components/AdminArea/components/PlaybackModeShare/PlaybackModeShare';
import { useStatistics } from '@ValenceScreens/admin/useStatistics';
import { nameOfSession } from '@ValenceScreens/admin/nameOfSession';
import {
  Clock as ClockIcon,
  Folder as FolderIcon,
  Terminal as TerminalIcon,
  Tv as TvIcon,
} from '@keyline-icons/react/fill';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import { DataTable } from '@ValenceUI/DataTable';
import { describeLogTime } from '@ValenceClient/admin/describeLogTime';
import type { LogRecord } from '@ValenceContracts/schemas/Log';
import { ShareChart } from '@ValenceUI/ShareChart';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { NothingHere } from '@ValenceUI/NothingHere';
import type { ActiveSession, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { LogLevelBadge } from '@ValenceScreens/components/LogLevelBadge/LogLevelBadge';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { StorageInfo } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/StorageInfo/StorageInfo';
import { CacheBreakdown } from '@ValenceScreens/components/AdminArea/components/CacheBreakdown/CacheBreakdown';
import { LoadRangeToggle } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadRangeToggle/LoadRangeToggle';
import { LoadChart } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadChart/LoadChart';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { describeQueueKind } from '@ValenceScreens/components/AdminArea/describeQueueKind';
import type { LoadRange } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadRangeToggle/LoadRangeToggle.types';
import type { OverviewPanelProps } from './OverviewPanel.types';
import type { OverviewReading } from './OverviewReading.types';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { say } from '@ValenceI18n/say';

const RECENT_LOGS_EVERY_MS = 10_000;

const NOTHING_TO_READ: OverviewReading = { libraries: false, sessions: false, monitor: false };

type RunningJob = Monitor['queue']['jobs'][number];

/**
 * The state of the server at a glance: what needs a person, what is being watched, what the machine
 * is doing, what the libraries hold, and what is on the disk. Everything here is a summary with a
 * way through to the panel that can act on it, so the dashboard answers "is anything wrong" without
 * trying to be the place anything is fixed.
 *
 * @param overview - What the server reports about itself, or null before it has answered.
 * @param monitor - The latest readings, or null before any have arrived.
 * @param libraries - The libraries configured, of which only this server's own are listed.
 * @param sessions - What is being watched at the moment.
 * @param stillReading - Which of the libraries, the sessions and the readings have not arrived for
 *   the first time yet, so none of them is said to be empty before it has.
 * @param readings - The readings taken while the page has been open, for the last minute's chart.
 * @param onOpenPanel - Called with the panel to open.
 */
const OverviewPanel = ({
  overview,
  monitor,
  libraries,
  sessions,
  stillReading = NOTHING_TO_READ,
  readings,
  onOpenPanel,
}: OverviewPanelProps) => {
  const week = useStatistics('week');
  const [loadRange, setLoadRange] = useState<LoadRange>('7d');
  const own = libraries.filter((library) => (library.linkedServerId ?? null) === null);

  const askedLoadHistory = useQuery({
    ...adminQueries.resourceHistory(loadRange === 'minute' ? '24h' : loadRange),
    enabled: loadRange !== 'minute',
  });

  const rangeSamples = useMemo(
    () => (loadRange === 'minute' ? [] : (askedLoadHistory.data ?? [])),
    [loadRange, askedLoadHistory.data],
  );

  const now = useTicking(A_CAPTION_AGES_EVERY);
  const watching = sessions.filter(
    (session) =>
      session.playback !== null ||
      session.listening !== null ||
      session.bookListening !== null ||
      session.reading !== null,
  );
  const running = (monitor?.queue.jobs ?? []).filter((job) => job.state === 'running');
  const waiting = monitor?.queue.queued ?? 0;

  const recentLogs = useQuery({
    ...adminQueries.logs({ levels: ['info', 'warn', 'error'], sort: 'newest', limit: 8 }),
    refetchInterval: RECENT_LOGS_EVERY_MS,
  });

  const logColumns: DataTableColumn<LogRecord>[] = [
    {
      id: 'time',
      header: say('common.time'),
      accessorFn: (record) => record.atMs,
      cell: ({ row }) => (
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {describeLogTime(row.original.atMs)}
        </span>
      ),
    },
    {
      id: 'level',
      meta: { hidesOnPhones: true },
      header: say('screens.logDetailDialog.level'),
      accessorFn: (record) => record.level,
      cell: ({ row }) => <LogLevelBadge level={row.original.level} />,
    },
    {
      id: 'source',
      meta: { hidesOnPhones: true },
      header: say('common.source'),
      accessorFn: (record) => record.source,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-text-muted">{String(getValue())}</span>
      ),
    },
    {
      id: 'message',
      header: say('screens.adminArea.sessionCard.message'),
      accessorFn: (record) => record.message,
      cell: ({ getValue }) => (
        <span className="block max-w-[28rem] truncate font-mono text-xs text-text">
          {String(getValue())}
        </span>
      ),
    },
  ];

  const sessionColumns: DataTableColumn<ActiveSession>[] = [
    {
      id: 'title',
      header: say('screens.adminArea.overviewPanel.whatIsOn'),
      accessorFn: (session) =>
        session.playback?.mediaTitle ??
        session.listening?.title ??
        session.bookListening?.title ??
        session.reading?.title ??
        '',
      cell: ({ getValue }) => <span className="truncate text-text">{String(getValue())}</span>,
    },
    {
      id: 'who',
      header: say('screens.adminArea.overviewPanel.whoAndWhere'),
      accessorFn: (session) => `${nameOfSession(session)} · ${session.deviceLabel}`,
      cell: ({ getValue }) => (
        <span className="truncate text-text-muted">{String(getValue())}</span>
      ),
    },
    {
      id: 'delivery',
      header: say('screens.adminArea.overviewPanel.how'),
      accessorFn: (session) =>
        session.reading !== null && session.bookListening === null
          ? say('common.reading')
          : session.playback?.mode === 'transcode' || session.listening?.delivery === 'encoded'
            ? say('common.transcode')
            : say('common.direct'),
      cell: ({ getValue }) => <Badge size="sm">{String(getValue())}</Badge>,
    },
  ];

  const jobColumns: DataTableColumn<RunningJob>[] = [
    {
      id: 'subject',
      header: say('screens.adminArea.overviewPanel.whatIsOn'),
      accessorFn: (job) => job.subject,
      cell: ({ getValue }) => <span className="truncate text-text">{String(getValue())}</span>,
    },
    {
      id: 'kind',
      header: say('screens.adminArea.overviewPanel.kindOfWork'),
      accessorFn: (job) => describeQueueKind(job.kind),
      cell: ({ getValue }) => (
        <span className="truncate text-text-muted">{String(getValue())}</span>
      ),
    },
    {
      id: 'status',
      header: say('screens.adminArea.overviewPanel.how'),
      accessorFn: () => describeJobStatus('running').label,
      cell: () => (
        <Badge size="sm" tone={describeJobStatus('running').tone}>
          {describeJobStatus('running').label}
        </Badge>
      ),
    },
  ];

  const libraryColumns: DataTableColumn<Library>[] = [
    {
      id: 'name',
      header: say('common.name'),
      accessorFn: (library) => library.name,
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-text">{row.original.name}</span>
          <Badge size="sm">{LIBRARY_KIND_NAMES[row.original.kind].label}</Badge>
        </span>
      ),
    },
    {
      id: 'scanned',
      meta: { hidesOnPhones: true },
      header: say('screens.adminArea.librariesPanel.lastRead'),
      accessorFn: (library) => describeSince(library.lastScannedAt, now),
      cell: ({ getValue }) => <span className="text-text-muted">{String(getValue())}</span>,
    },
    {
      id: 'size',
      header: say('common.size'),
      accessorFn: (library) => library.sizeBytes ?? 0,
      cell: ({ row }) =>
        row.original.sizeBytes === undefined ? null : (
          <FormattedBytes bytes={row.original.sizeBytes} className="tabular-nums text-text-muted" />
        ),
    },
    {
      id: 'items',
      header: say('common.items'),
      accessorFn: (library) => library.itemCount,
      cell: ({ row }) => (
        <span className="tabular-nums text-text-muted">
          <FormattedNumber value={row.original.itemCount} />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <NeedsYouCard onOpenPanel={onOpenPanel} />
        </div>

        <DashboardRegion
          title={say('screens.adminArea.overviewPanel.serverLoad')}
          className="sm:col-span-2 lg:col-span-3"
          actions={<LoadRangeToggle value={loadRange} onChange={setLoadRange} />}
        >
          <LoadChart
            readings={loadRange === 'minute' ? readings : rangeSamples}
            range={loadRange}
          />
        </DashboardRegion>

        <DashboardRegion
          title={say('screens.adminArea.overviewPanel.diskUsage')}
          action={say('common.manage')}
          onAction={() => {
            onOpenPanel('libraries');
          }}
          className="sm:col-span-2 lg:col-span-1"
        >
          {stillReading.libraries ? (
            <Spinner isCentered size="sm" label={say('common.readingTheLibraries')} />
          ) : (
            <ShareChart
              label={say('screens.adminArea.overviewPanel.howTheLibrariesShareTheDisk')}
              slices={[...own]
                .sort((one, other) => (other.sizeBytes ?? 0) - (one.sizeBytes ?? 0))
                .map((library) => ({
                  id: library.id,
                  label: library.name,
                  value: library.sizeBytes ?? 0,
                  shown: <FormattedBytes bytes={library.sizeBytes ?? 0} />,
                }))}
              total={
                <FormattedBytes
                  bytes={own.reduce((sum, library) => sum + (library.sizeBytes ?? 0), 0)}
                />
              }
              totalLabel={say('screens.adminArea.overviewPanel.inTheLibraries')}
              emptyMessage={say('screens.adminArea.overviewPanel.noLibrariesYet')}
            />
          )}
        </DashboardRegion>

        <DashboardRegion
          isFlush
          title={say('screens.adminArea.overviewPanel.activeNow')}
          action={say('screens.adminArea.overviewPanel.allSessions')}
          onAction={() => {
            onOpenPanel('activity');
          }}
        >
          {stillReading.sessions ? (
            <Spinner isCentered size="sm" label={say('common.loading')} />
          ) : watching.length === 0 ? (
            <NothingHere
              isCompact
              of={TvIcon}
              title={say('screens.adminArea.overviewPanel.nobodyIsWatchingListeningOrReading')}
            />
          ) : (
            <DataTable
              label={say('screens.adminArea.overviewPanel.activeNow')}
              columns={sessionColumns}
              rows={watching}
              getRowId={(session) => session.clientId}
              height="parent"
            />
          )}
        </DashboardRegion>

        <DashboardRegion
          isFlush
          title={say('screens.adminArea.overviewPanel.runningNow')}
          action={say('screens.adminArea.overviewPanel.allJobs')}
          onAction={() => {
            onOpenPanel('jobs');
          }}
        >
          {stillReading.monitor ? (
            <Spinner isCentered size="sm" label={say('common.loading')} />
          ) : running.length === 0 ? (
            <NothingHere
              isCompact
              of={ClockIcon}
              title={say('screens.adminArea.overviewPanel.nothingIsRunning')}
              {...(waiting === 0
                ? {}
                : {
                    detail: say('screens.adminArea.overviewPanel.nothingRunningWaiting', {
                      waiting: waiting.toLocaleString(),
                    }),
                  })}
            />
          ) : (
            <DataTable
              label={say('screens.adminArea.overviewPanel.runningNow')}
              columns={jobColumns}
              rows={running}
              getRowId={(job) => job.id.toString()}
              height="parent"
            />
          )}
        </DashboardRegion>

        <DashboardRegion
          isFlush
          title={say('common.libraries')}
          className="sm:col-span-2 lg:col-span-2"
          action={say('common.manage')}
          onAction={() => {
            onOpenPanel('libraries');
          }}
        >
          {stillReading.libraries ? (
            <Spinner isCentered size="sm" label={say('common.readingTheLibraries')} />
          ) : own.length === 0 ? (
            <NothingHere
              isCompact
              of={FolderIcon}
              title={say('screens.adminArea.overviewPanel.noLibrariesYet')}
            />
          ) : (
            <DataTable
              label={say('common.libraries')}
              columns={libraryColumns}
              rows={own}
              getRowId={(library) => library.id}
              height="parent"
            />
          )}
        </DashboardRegion>

        <DashboardRegion
          title={say('screens.adminArea.statisticsPanel.howThingsPlayed')}
          action={say('screens.adminArea.adminSections.statistics')}
          onAction={() => {
            onOpenPanel('statistics');
          }}
          className="sm:col-span-1 lg:col-span-1"
        >
          {week.isLoadingError ? (
            <p className="text-sm text-text-muted">
              {say('screens.adminArea.statisticsPanel.theStatisticsCouldNotBeRead')}
            </p>
          ) : week.isPending ? (
            <Spinner
              isCentered
              size="sm"
              label={say('screens.adminArea.statisticsPanel.readingTheStatistics')}
            />
          ) : (
            <PlaybackModeShare modes={week.data.modes} />
          )}
        </DashboardRegion>

        <DashboardRegion
          title={say('screens.adminArea.mostWatchedList.mostWatched')}
          action={say('screens.adminArea.adminSections.statistics')}
          onAction={() => {
            onOpenPanel('statistics');
          }}
          className="sm:col-span-1 lg:col-span-1"
        >
          {week.isLoadingError ? (
            <p className="text-sm text-text-muted">
              {say('screens.adminArea.statisticsPanel.theStatisticsCouldNotBeRead')}
            </p>
          ) : week.isPending ? (
            <Spinner
              isCentered
              size="sm"
              label={say('screens.adminArea.statisticsPanel.readingTheStatistics')}
            />
          ) : (
            <MostWatchedList titles={week.data.topTitles} limit={6} />
          )}
        </DashboardRegion>

        <div className="sm:col-span-2 lg:col-span-2">
          <WhatsNewCard
            libraries={own}
            isReadingLibraries={stillReading.libraries}
            onOpenPanel={onOpenPanel}
          />
        </div>

        <DashboardRegion
          title={say('screens.adminArea.overviewPanel.storageValenceIsUsing')}
          className="sm:col-span-2 lg:col-span-2"
          actions={
            <StorageInfo
              cache={monitor?.cache ?? null}
              artwork={overview?.artwork ?? null}
              bookPages={overview?.bookPages ?? null}
              libraryBytes={overview?.library.bytes ?? null}
            />
          }
        >
          <CacheBreakdown
            cache={monitor?.cache ?? null}
            artwork={overview?.artwork ?? null}
            bookPages={overview?.bookPages ?? null}
            liveSessions={monitor?.sessions ?? 0}
            library={
              overview === null
                ? null
                : {
                    bytes: overview.library.bytes,
                    itemCount: overview.library.itemCount,
                  }
            }
          />
        </DashboardRegion>

        <DashboardRegion
          title={say('screens.adminArea.overviewPanel.recentLogs')}
          action={say('screens.adminArea.overviewPanel.allLogs')}
          onAction={() => {
            onOpenPanel('jobs');
          }}
          isFlush
          className="sm:col-span-2 lg:col-span-2"
        >
          {recentLogs.isLoadingError ? (
            <p className="p-4 text-sm text-text-muted">
              {say('screens.adminArea.overviewPanel.theLogsCouldNotBeRead')}
            </p>
          ) : recentLogs.isPending ? (
            <Spinner isCentered size="sm" label={say('common.loading')} />
          ) : recentLogs.data.records.length === 0 ? (
            <NothingHere
              isCompact
              of={TerminalIcon}
              title={say('screens.observabilityPage.logExplorer.noLogLinesMatchThis')}
            />
          ) : (
            <DataTable
              label={say('screens.adminArea.overviewPanel.recentLogs')}
              columns={logColumns}
              rows={recentLogs.data.records}
              getRowId={(record) => record.id}
              height="parent"
            />
          )}
        </DashboardRegion>
      </div>
    </div>
  );
};

OverviewPanel.displayName = 'OverviewPanel';

export { OverviewPanel };

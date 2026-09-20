import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { nameOfSession } from '@ValenceScreens/admin/nameOfSession';
import { ArrowRight01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { cn } from '@ValenceUI/cn';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { BackgroundJobs } from '@ValenceScreens/components/AdminArea/components/BackgroundJobs/BackgroundJobs';
import { CacheBreakdown } from '@ValenceScreens/components/AdminArea/components/CacheBreakdown/CacheBreakdown';
import { LoadRangeToggle } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadRangeToggle/LoadRangeToggle';
import { TrendChart } from '@ValenceUI/TrendChart';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { describeQueueKind } from '@ValenceScreens/components/AdminArea/describeQueueKind';
import { measureStorage } from '@ValenceClient/admin/fetchAdmin';
import type { StorageCount } from '@ValenceClient/admin/fetchAdmin';
import type { LoadRange } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadRangeToggle/LoadRangeToggle.types';
import type { OverviewPanelProps } from './OverviewPanel.types';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';

/**
 * One region of the dashboard: a heading, an optional action in its corner, and whatever the region
 * shows. Exists so that every region is the same shape and spacing without each rebuilding it.
 *
 * @param title - What the region is called.
 * @param action - What its corner control does, where it has one.
 * @param onAction - Called when that control is pressed.
 * @param actionIcon - The icon on that control.
 * @param isActionBusy - Whether that control's work is in flight.
 * @param actions - A control other than the usual single button, for a corner that needs more than
 *   one choice.
 * @param isFlush - Whether what it shows runs to the card's edges, for a table.
 * @param children - What the region shows.
 * @param className - Anything extra the layout needs of it.
 */
const Region = ({
  title,
  action,
  onAction,
  actionIcon,
  isActionBusy = false,
  actions,
  isFlush = false,
  children,
  className,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  actionIcon?: IconGlyph;
  isActionBusy?: boolean;
  actions?: ReactNode;
  isFlush?: boolean;
  children: ReactNode;
  className?: string;
}) => (
  <PanelCard
    title={title}
    isFlush={isFlush}
    className={cn('h-full min-w-0', className)}
    {...(actions !== undefined
      ? { actions }
      : action === undefined || onAction === undefined
        ? {}
        : {
            actions: (
              <PanelCardAction
                icon={actionIcon ?? ArrowRight01Icon}
                onClick={onAction}
                isDisabled={isActionBusy}
                isLoading={isActionBusy}
              >
                {action}
              </PanelCardAction>
            ),
          })}
  >
    <div className="mt-auto">{children}</div>
  </PanelCard>
);

Region.displayName = 'Region';

/**
 * The state of the server at a glance: what needs a person, what is being watched, what the machine
 * is doing, what the libraries hold, and what is on the disk. Everything here is a summary with a
 * way through to the panel that can act on it, so the dashboard answers "is anything wrong" without
 * trying to be the place anything is fixed.
 *
 * @param overview - What the server reports about itself, or null before it has answered.
 * @param monitor - The latest readings, or null before any have arrived.
 * @param libraries - The libraries configured.
 * @param sessions - What is being watched at the moment.
 * @param history - Recent processor readings, for the graph and for telling a spike from load.
 * @param onOpenPanel - Called with the panel to open.
 */
const OverviewPanel = ({
  overview,
  monitor,
  libraries,
  sessions,
  history,
  onOpenPanel,
}: OverviewPanelProps) => {
  const [counted, setCounted] = useState<StorageCount | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const [loadRange, setLoadRange] = useState<LoadRange>('minute');

  const askedLoadHistory = useQuery({
    ...adminQueries.resourceHistory(loadRange === 'minute' ? '24h' : loadRange),
    enabled: loadRange !== 'minute',
  });

  const rangeSamples = useMemo(
    () => (loadRange === 'minute' ? [] : (askedLoadHistory.data ?? [])),
    [loadRange, askedLoadHistory.data],
  );

  const rangeValues = useMemo(
    () => rangeSamples.map((sample) => sample.systemCpuPercent),
    [rangeSamples],
  );

  const latestRangeSample = rangeSamples.at(-1) ?? null;

  const recount = async () => {
    setIsCounting(true);

    try {
      const measured = await measureStorage();

      if (measured !== null) {
        setCounted(measured);
      }
    } finally {
      setIsCounting(false);
    }
  };

  const now = Date.now();
  const watching = sessions.filter((session) => session.playback !== null);
  const running = (monitor?.queue.jobs ?? []).filter((job) => job.state === 'running');
  const waiting = monitor?.queue.queued ?? 0;
  const resources = monitor?.resources ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Region
          title="Server load"
          className="sm:col-span-2 xl:col-span-4"
          actions={<LoadRangeToggle value={loadRange} onChange={setLoadRange} />}
        >
          {loadRange === 'minute' ? (
            <TrendChart
              values={history}
              ceiling={100}
              label="Processor use over the last minute"
              caption={
                resources === null ? (
                  'Waiting for the first reading.'
                ) : (
                  <>
                    Now <AnimatedNumber value={Math.round(resources.systemCpuPercent)} suffix="%" />{' '}
                    · peak <AnimatedNumber value={Math.round(Math.max(0, ...history))} suffix="%" />{' '}
                    · <AnimatedNumber value={resources.cpuCount} suffix=" processors" /> · load{' '}
                    <AnimatedNumber
                      value={resources.loadAverage}
                      format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                    />
                  </>
                )
              }
            />
          ) : (
            <TrendChart
              values={rangeValues}
              ceiling={100}
              label={`Processor use over the last ${loadRange}`}
              {...(rangeValues.length === 0
                ? {}
                : {
                    caption: (
                      <>
                        Peak{' '}
                        <AnimatedNumber
                          value={Math.round(Math.max(0, ...rangeValues))}
                          suffix="%"
                        />{' '}
                        · average{' '}
                        <AnimatedNumber
                          value={Math.round(
                            rangeValues.reduce((sum, value) => sum + value, 0) / rangeValues.length,
                          )}
                          suffix="%"
                        />{' '}
                        ·{' '}
                        {latestRangeSample === null ? (
                          '—'
                        ) : (
                          <AnimatedNumber value={latestRangeSample.cpuCount} />
                        )}{' '}
                        processors
                      </>
                    ),
                  })}
            />
          )}
        </Region>

        <Region
          title="Watching now"
          action="All sessions"
          onAction={() => {
            onOpenPanel('activity');
          }}
        >
          {watching.length === 0 ? (
            <p className="text-sm text-text-muted">Nobody is watching anything.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {watching.map((session) => (
                <li key={session.clientId} className="flex items-center gap-4 py-3 first:pt-0">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm text-text">
                      {session.playback?.mediaTitle ?? ''}
                    </span>
                    <span className="truncate text-xs text-text-muted">
                      {nameOfSession(session)} · {session.deviceLabel}
                    </span>
                  </span>

                  <Badge size="sm">
                    {session.playback?.mode === 'direct' ? 'Direct' : 'Transcode'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Region>

        <Region
          title="Running now"
          action="All jobs"
          onAction={() => {
            onOpenPanel('jobs');
          }}
        >
          {running.length === 0 ? (
            <p className="text-sm text-text-muted">
              {waiting === 0 ? (
                'Nothing is running.'
              ) : (
                <>
                  Nothing running, <AnimatedNumber value={waiting} suffix=" waiting" />.
                </>
              )}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {running.map((job) => (
                <li key={job.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm text-text">{job.subject}</span>
                    <span className="truncate text-xs text-text-muted">
                      {describeQueueKind(job.kind)}
                    </span>
                  </span>

                  <Badge size="sm" tone={describeJobStatus('running').tone}>
                    {describeJobStatus('running').label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Region>

        <Region
          title="Libraries"
          className="sm:col-span-2 xl:col-span-2"
          action="Manage"
          onAction={() => {
            onOpenPanel('libraries');
          }}
        >
          {libraries.length === 0 ? (
            <p className="text-sm text-text-muted">No libraries yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {libraries.map((library) => (
                <li key={library.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm text-text">
                      <span className="truncate">{library.name}</span>
                      <Badge size="sm">{library.kind}</Badge>
                    </span>
                    <span className="text-xs text-text-muted">
                      Scanned {describeSince(library.lastScannedAt, now)}
                    </span>
                  </span>

                  <span className="shrink-0 text-sm tabular-nums text-text-muted">
                    <AnimatedNumber
                      value={library.itemCount}
                      suffix={library.itemCount === 1 ? ' item' : ' items'}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Region>

        <Region
          title="Storage Valence is using"
          className="sm:col-span-2 xl:col-span-4"
          action="Refresh"
          actionIcon={RefreshIcon}
          isActionBusy={isCounting}
          onAction={() => {
            void recount();
          }}
        >
          <CacheBreakdown
            cache={counted?.cache ?? monitor?.cache ?? null}
            artwork={counted?.artwork ?? overview?.artwork ?? null}
            bookPages={counted?.bookPages ?? overview?.bookPages ?? null}
            liveSessions={monitor?.sessions ?? 0}
            library={
              overview === null
                ? null
                : {
                    bytes: counted?.libraryBytes ?? overview.library.bytes,
                    itemCount: overview.library.itemCount,
                  }
            }
          />
        </Region>

        <Region
          title="Recent jobs"
          action="All work"
          onAction={() => {
            onOpenPanel('jobs');
          }}
          isFlush
          className="sm:col-span-2 xl:col-span-4"
        >
          <BackgroundJobs monitor={monitor} pageSize={5} />
        </Region>
      </div>
    </div>
  );
};

OverviewPanel.displayName = 'OverviewPanel';

export { OverviewPanel };

import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { nameOfSession } from '@ValenceScreens/admin/nameOfSession';
import { ChevronRight as ChevronRightFilledIcon } from '@keyline-icons/react/fill';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { cn } from '@ValenceUI/cn';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { BackgroundJobs } from '@ValenceScreens/components/AdminArea/components/BackgroundJobs/BackgroundJobs';
import { StorageInfo } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/StorageInfo/StorageInfo';
import { CacheBreakdown } from '@ValenceScreens/components/AdminArea/components/CacheBreakdown/CacheBreakdown';
import { LoadRangeToggle } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadRangeToggle/LoadRangeToggle';
import { LoadChart } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadChart/LoadChart';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { describeQueueKind } from '@ValenceScreens/components/AdminArea/describeQueueKind';
import type { LoadRange } from '@ValenceScreens/components/AdminArea/components/OverviewPanel/components/LoadRangeToggle/LoadRangeToggle.types';
import type { OverviewPanelProps } from './OverviewPanel.types';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { say } from '@ValenceI18n/say';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';

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
                icon={actionIcon ?? ChevronRightFilledIcon}
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
 * @param readings - The readings taken while the page has been open, for the last minute's chart.
 * @param onOpenPanel - Called with the panel to open.
 */
const OverviewPanel = ({
  overview,
  monitor,
  libraries,
  sessions,
  readings,
  onOpenPanel,
}: OverviewPanelProps) => {
  const [loadRange, setLoadRange] = useState<LoadRange>('7d');

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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Region
          title={say('screens.adminArea.overviewPanel.serverLoad')}
          className="sm:col-span-2 xl:col-span-4"
          actions={<LoadRangeToggle value={loadRange} onChange={setLoadRange} />}
        >
          <LoadChart
            readings={loadRange === 'minute' ? readings : rangeSamples}
            range={loadRange}
          />
        </Region>

        <Region
          title={say('screens.adminArea.overviewPanel.activeNow')}
          action={say('screens.adminArea.overviewPanel.allSessions')}
          onAction={() => {
            onOpenPanel('activity');
          }}
        >
          {watching.length === 0 ? (
            <p className="text-sm text-text-muted">
              {say('screens.adminArea.overviewPanel.nobodyIsWatchingListeningOrReading')}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {watching.map((session) => (
                <li key={session.clientId} className="flex items-center gap-4 py-3 first:pt-0">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm text-text">
                      {session.playback?.mediaTitle ??
                        session.listening?.title ??
                        session.bookListening?.title ??
                        session.reading?.title ??
                        ''}
                    </span>
                    <span className="truncate text-xs text-text-muted">
                      {nameOfSession(session)} · {session.deviceLabel}
                    </span>
                  </span>

                  <Badge size="sm">
                    {session.reading !== null && session.bookListening === null
                      ? say('common.reading')
                      : session.playback?.mode === 'transcode' ||
                          session.listening?.delivery === 'encoded'
                        ? say('common.transcode')
                        : say('common.direct')}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Region>

        <Region
          title={say('screens.adminArea.overviewPanel.runningNow')}
          action={say('screens.adminArea.overviewPanel.allJobs')}
          onAction={() => {
            onOpenPanel('jobs');
          }}
        >
          {running.length === 0 ? (
            <p className="text-sm text-text-muted">
              {waiting === 0 ? (
                say('screens.adminArea.overviewPanel.nothingIsRunning')
              ) : (
                <Sentence
                  words="screens.adminArea.overviewPanel.nothingRunningWaiting"
                  fillings={{ waiting: <FormattedNumber value={waiting} /> }}
                />
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
          title={say('common.libraries')}
          className="sm:col-span-2 xl:col-span-2"
          action={say('common.manage')}
          onAction={() => {
            onOpenPanel('libraries');
          }}
        >
          {libraries.length === 0 ? (
            <p className="text-sm text-text-muted">
              {say('screens.adminArea.overviewPanel.noLibrariesYet')}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {libraries.map((library) => (
                <li key={library.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm text-text">
                      <span className="truncate">{library.name}</span>
                      <Badge size="sm">{LIBRARY_KIND_NAMES[library.kind].label}</Badge>
                    </span>
                    <span className="text-xs text-text-muted">
                      {say('screens.adminArea.overviewPanel.scannedLastScannedAt', {
                        lastScannedAt: describeSince(library.lastScannedAt, now),
                      })}
                    </span>
                  </span>

                  <span className="shrink-0 text-sm tabular-nums text-text-muted">
                    <Sentence
                      counted="common.count.items"
                      count={library.itemCount}
                      fillings={{ count: <FormattedNumber value={library.itemCount} /> }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Region>

        <Region
          title={say('screens.adminArea.overviewPanel.storageValenceIsUsing')}
          className="sm:col-span-2 xl:col-span-4"
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
        </Region>

        <Region
          title={say('screens.adminArea.overviewPanel.recentJobs')}
          action={say('screens.adminArea.overviewPanel.allWork')}
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

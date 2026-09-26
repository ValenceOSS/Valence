import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { OBSERVABILITY_VIEWS } from '@ValenceClient/admin/ObservabilitySearchSchema';
import { setQueuePaused } from '@ValenceClient/admin/fetchAdmin';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { useObservabilitySearch } from '@ValenceScreens/admin/useObservabilitySearch';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { JobRunner } from '@ValenceScreens/components/AdminArea/components/JobRunner/JobRunner';
import { JobSchedulePage } from '@ValenceScreens/components/AdminArea/components/JobSchedulePage/JobSchedulePage';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { JobHealth } from './components/JobHealth/JobHealth';
import { JobHistory } from './components/JobHistory/JobHistory';
import { JobTraceDialog } from './components/JobTraceDialog/JobTraceDialog';
import { LogExplorer } from './components/LogExplorer/LogExplorer';
import { QueueConcurrency } from './components/QueueConcurrency/QueueConcurrency';
import type {
  ObservabilitySearch,
  ObservabilityView,
} from '@ValenceClient/admin/ObservabilitySearchSchema';
import type { ObservabilityPageProps } from './ObservabilityPage.types';

/**
 * Whether a string the tab row handed back actually names one of this page's views.
 *
 * @param value - What was chosen.
 * @returns Whether it names a view.
 */
const isView = (value: string): value is ObservabilityView =>
  OBSERVABILITY_VIEWS.some((view) => view === value);

/**
 * Everything the server has to say about itself, on one page: the jobs it has run, the log, how the
 * jobs are doing and how to run and schedule them. It replaces the two pages that used to show the
 * log and the jobs apart — an operator asking "why did the scan fail" no longer has to carry a job's
 * id from one to the other.
 *
 * It is one card, like the other admin pages, and nothing inside it is a card: its sections are laid
 * flat within it, because it is a working surface for reading a great deal at once. The four views are its tabs. Anything that names a job — a line in the log, a row in
 * the runs — can open that job's trace, and a run can open the log narrowed to it; the two are
 * different ways to look at the same records.
 *
 * The queue's own state and controls stay in the heading, because pausing the queue is the thing an
 * operator wants within reach from whichever view they are looking at.
 *
 * @param definitions - The jobs the server offers.
 * @param libraries - The libraries a job can be run against.
 * @param progress - What is running now, by library.
 * @param monitor - The latest readings, or null before any have arrived.
 * @param viewingJobKind - The job whose schedule is open, if any.
 * @param schedules - What makes each job run on its own.
 * @param schedulesTimezone - The zone a clock trigger is read in.
 * @param search - What the address says: which view is open, and what each is narrowed to.
 * @param onSearchChange - Told each change, to write into the address.
 * @param onRun - Called with the job to start, the libraries to start it on for one that takes them,
 *   and the parts to clear for the one that clears them.
 * @param onStop - Called with the job to stop.
 * @param onOpenSchedule - Called with the job whose schedule is to be opened.
 * @param onCloseSchedule - Called on going back to the list.
 * @param onAddTrigger - Called with a job and a trigger to add to it.
 * @param onRemoveTrigger - Called with a job and the trigger to remove from it.
 */
const ObservabilityPage = ({
  definitions,
  libraries,
  progress,
  monitor,
  viewingJobKind,
  schedules,
  schedulesTimezone = null,
  search: given = {},
  onSearchChange,
  onRun,
  onStop,
  onOpenSchedule,
  onCloseSchedule,
  onAddTrigger,
  onRemoveTrigger,
}: ObservabilityPageProps) => {
  const [search, hold] = useObservabilitySearch(given, onSearchChange);
  const update = useCallback(
    (change: ObservabilitySearch) => {
      const isOnlyMovingAbout = Object.keys(change).every((key) =>
        ['view', 'rpage', 'hpage'].includes(key),
      );

      hold(isOnlyMovingAbout ? change : { ...change, rpage: undefined, hpage: undefined });
    },
    [hold],
  );
  const view = search.view ?? 'jobs';
  const [tracing, setTracing] = useState<string | null>(null);
  const travel = useTravelDirection([...OBSERVABILITY_VIEWS], view);
  const working = useMemo(() => monitor?.queue.jobs ?? [], [monitor]);
  const failures = useQuery(adminQueries.recentFailures()).data?.total ?? 0;
  const viewing =
    viewingJobKind === null
      ? null
      : (definitions.find((definition) => definition.kind === viewingJobKind) ?? null);

  const showLogFor = useCallback(
    (jobId: string) => {
      setTracing(null);
      update({
        view: 'logs',
        q: `job:${jobId}`,
        range: 'all',
        from: undefined,
        until: undefined,
        sort: undefined,
      });
    },
    [update],
  );

  return (
    <div className="flex flex-col gap-4">
      <DialogCompanion
        label={viewing?.label ?? 'Schedule'}
        isOpen={viewing !== null}
        onClose={onCloseSchedule}
      >
        {viewing === null ? null : (
          <>
            <DialogTitle size="compact" title={viewing.label} detail={viewing.description} />

            <DialogContent>
              <JobSchedulePage
                triggers={schedules.get(viewing.kind) ?? []}
                onAdd={(trigger) => {
                  onAddTrigger(viewing.kind, trigger);
                }}
                onRemove={(triggerId) => {
                  onRemoveTrigger(viewing.kind, triggerId);
                }}
                timezone={schedulesTimezone}
              />
            </DialogContent>

            <DialogFooter dismiss={{ onChoose: onCloseSchedule }} />
          </>
        )}
      </DialogCompanion>

      <JobTraceDialog
        jobRunId={tracing}
        definitions={definitions}
        onClose={() => {
          setTracing(null);
        }}
        onOpenInLogs={showLogFor}
      />

      <Tabs
        value={view}
        onValueChange={(next) => {
          if (isView(next)) {
            update({ view: next === 'jobs' ? undefined : next });
          }
        }}
      >
        <PanelCard
          title="Jobs & logs"
          actions={
            <>
              <span className="text-xs text-text-muted">
                {monitor === null ? (
                  '—'
                ) : (
                  <>
                    <AnimatedNumber value={monitor.queue.running} suffix=" running" /> ·{' '}
                    <AnimatedNumber value={monitor.queue.queued} suffix=" waiting" />
                    {failures === 0 ? null : (
                      <>
                        {' '}
                        ·{' '}
                        <Button
                          variant="link"
                          size="none"
                          label="Show the jobs that failed in the last 24 hours"
                          hasTooltip={false}
                          onClick={() => {
                            update({
                              view: 'jobs',
                              rstatus: 'failed',
                              range: '24h',
                              rq: undefined,
                              from: undefined,
                              until: undefined,
                            });
                          }}
                        >
                          <span className="text-xs text-danger">
                            <AnimatedNumber value={failures} suffix=" failed" />
                          </span>
                        </Button>
                      </>
                    )}
                  </>
                )}
              </span>

              {monitor === null ? null : (
                <>
                  {monitor.queue.paused ? (
                    <Badge size="sm" tone="warning">
                      Paused
                    </Badge>
                  ) : null}

                  <QueueConcurrency concurrency={monitor.queue.concurrency} />

                  <PanelCardAction
                    icon={monitor.queue.paused ? PlayFilledIcon : PauseFilledIcon}
                    onClick={() => {
                      void setQueuePaused(!monitor.queue.paused);
                    }}
                  >
                    {monitor.queue.paused ? 'Resume' : 'Pause'}
                  </PanelCardAction>
                </>
              )}
            </>
          }
          below={
            <TabRow
              label="What to look at"
              tone="underlined"
              size="sm"
              value={view}
              groups={[
                {
                  items: [
                    { id: 'jobs', label: 'Jobs' },
                    { id: 'logs', label: 'Logs' },
                    { id: 'health', label: 'Health' },
                    { id: 'run', label: 'Run & schedule' },
                  ],
                },
              ]}
            />
          }
        >
          <TabPanel value="jobs" travel={travel}>
            <JobHistory
              definitions={definitions}
              libraries={libraries}
              working={working}
              search={search}
              onSearchChange={update}
              onViewLogs={showLogFor}
              onTrace={setTracing}
            />
          </TabPanel>

          <TabPanel value="logs" travel={travel}>
            <LogExplorer
              definitions={definitions}
              search={search}
              onSearchChange={update}
              onTraceJob={setTracing}
            />
          </TabPanel>

          <TabPanel value="health" travel={travel}>
            <JobHealth definitions={definitions} search={search} onSearchChange={update} />
          </TabPanel>

          <TabPanel value="run" travel={travel}>
            <JobRunner
              working={working}
              definitions={definitions}
              libraries={libraries}
              progress={progress}
              onRun={onRun}
              onStop={onStop}
              onOpenSchedule={onOpenSchedule}
            />
          </TabPanel>
        </PanelCard>
      </Tabs>
    </div>
  );
};

ObservabilityPage.displayName = 'ObservabilityPage';

export { ObservabilityPage };

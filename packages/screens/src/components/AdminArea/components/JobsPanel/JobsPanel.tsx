import { useMemo, useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { JobRunner } from '@ValenceScreens/components/AdminArea/components/JobRunner/JobRunner';
import { JobHistory } from '@ValenceScreens/components/AdminArea/components/JobsPanel/components/JobHistory/JobHistory';
import { JobSchedulePage } from '@ValenceScreens/components/AdminArea/components/JobSchedulePage/JobSchedulePage';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import type { JobsPanelProps } from './JobsPanel.types';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';

const JOBS_TABS = ['history', 'run'] as const;

type JobsTab = (typeof JOBS_TABS)[number];

/**
 * Whether a string the tab row handed back actually names one of this page's tabs.
 *
 * @param value - What was chosen.
 * @returns Whether it names a tab.
 */
const isJobsTab = (value: string): value is JobsTab => JOBS_TABS.some((tab) => tab === value);

/**
 * The Work tab: what happened and what is happening, and what can be started by hand or set to run
 * on its own. One card rather than three — the live queue and the persisted history used to be shown
 * as two separate tables of the same jobs under two different words for the same states; the history
 * is kept live already, so it is the only one that needs to be here.
 *
 * Holds no state of its own about which job's schedule is open — that is decided above it, so that
 * opening one is a place the browser can return to. Which of its own two tabs is showing is not:
 * that resets when the page is left, the same as the Roles and Accounts editors' own tabs do.
 *
 * @param definitions - The jobs the server offers.
 * @param libraries - The libraries a job can be run against.
 * @param progress - What is running now, by library.
 * @param monitor - The latest readings, or null before any have arrived.
 * @param viewingJobKind - The job whose schedule is open, if any.
 * @param schedules - What makes each job run on its own.
 * @param onRun - Called with the job to start, the libraries to start it on for one that takes
 *   them, and the parts to clear for the one that clears them.
 * @param onStop - Called with the job to stop.
 * @param onOpenSchedule - Called with the job whose schedule is to be opened.
 * @param onCloseSchedule - Called on going back to the list.
 * @param onAddTrigger - Called with a job and a trigger to add to it.
 * @param onRemoveTrigger - Called with a job and the trigger to remove from it.
 * @param onViewLogs - Called with a job run's id, to open the log filtered to it.
 */
const JobsPanel = ({
  definitions,
  libraries,
  progress,
  monitor,
  viewingJobKind,
  schedules,
  schedulesTimezone = null,
  onRun,
  onStop,
  onOpenSchedule,
  onCloseSchedule,
  onAddTrigger,
  onRemoveTrigger,
  onViewLogs,
}: JobsPanelProps) => {
  const [tab, setTab] = useState<JobsTab>('history');
  const travel = useTravelDirection([...JOBS_TABS], tab);
  const working = useMemo(() => monitor?.queue.jobs ?? [], [monitor]);
  const failures = (monitor?.queue.jobs ?? []).filter((job) => job.state === 'failed').length;
  const viewing =
    viewingJobKind === null
      ? null
      : (definitions.find((definition) => definition.kind === viewingJobKind) ?? null);

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

      <Tabs
        value={tab}
        onValueChange={(next) => {
          if (isJobsTab(next)) {
            setTab(next);
          }
        }}
      >
        <PanelCard
          title="Jobs"
          isFlush
          actions={
            <span className="text-xs text-text-muted">
              {monitor === null ? (
                '—'
              ) : (
                <>
                  <AnimatedNumber value={monitor.queue.running} suffix=" running" /> ·{' '}
                  <AnimatedNumber value={monitor.queue.queued} suffix=" waiting" /> ·{' '}
                  <AnimatedNumber value={monitor.queue.concurrency} suffix=" at a time" />
                  {failures === 0 ? null : (
                    <>
                      {' '}
                      · <AnimatedNumber value={failures} suffix=" failed" />
                    </>
                  )}
                </>
              )}
            </span>
          }
          below={
            <TabRow
              label="What to show about jobs"
              tone="underlined"
              size="sm"
              value={tab}
              groups={[
                {
                  items: [
                    { id: 'history', label: 'History' },
                    { id: 'run', label: 'Run & schedule' },
                  ],
                },
              ]}
            />
          }
        >
          <TabPanel value="history" travel={travel}>
            <JobHistory
              definitions={definitions}
              libraries={libraries}
              working={working}
              onViewLogs={onViewLogs}
            />
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

JobsPanel.displayName = 'JobsPanel';

export { JobsPanel };

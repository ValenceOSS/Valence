import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { runQueuedJobNow } from '@ValenceClient/admin/fetchAdmin';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ScanProgressBar } from '@ValenceScreens/components/AdminArea/components/ScanProgressBar/ScanProgressBar';
import { describeQueueKind } from '@ValenceScreens/components/AdminArea/describeQueueKind';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';
import { tallyWork } from './tallyWork';
import type { Job } from '@ValenceClient/admin/fetchAdmin';
import type { RunningWorkDialogProps } from './RunningWorkDialog.types';

const isActive = (task: Job): boolean => task.state === 'running' || task.state === 'queued';

const ORDER: Readonly<Record<Job['state'], number>> = {
  running: 0,
  queued: 1,
  failed: 2,
  finished: 3,
};

/**
 * Everything one job is doing right now: how far along it is, and each task the transcoder's queue
 * has taken on for it, running or waiting, so a job that looks like a single line can be seen for
 * the many things it is.
 *
 * @param title - What the job is called.
 * @param isOpen - Whether the dialog is showing.
 * @param progress - How far along each piece of work says it is, where it says.
 * @param tasks - The queue's tasks that belong to this job. One that is still waiting can be started
 *   now, past the limit on how many run at once and past a pause.
 * @param onClose - Called when the dialog is dismissed.
 */
const RunningWorkDialog = ({ title, isOpen, progress, tasks, onClose }: RunningWorkDialogProps) => {
  const { running, waiting, notYetQueued } = tallyWork(progress, tasks);

  const renderTask = (task: Job) => (
    <li key={task.id} className="flex items-center gap-3 py-3 first:pt-0">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-text" title={task.subject}>
          {task.subject}
        </span>
        <span className="text-xs text-text-muted">{describeQueueKind(task.kind)}</span>
      </span>

      {task.state === 'queued' ? (
        <>
          <Button
            variant="ghost"
            size="xs"
            label={`Run ${task.subject} now`}
            hasTooltip={false}
            onClick={() => {
              void runQueuedJobNow(task.id);
            }}
          >
            Run now
          </Button>

          <Badge size="sm" tone="quiet">
            Waiting
          </Badge>
        </>
      ) : (
        <Badge size="sm" tone={describeJobStatus(task.state).tone}>
          {describeJobStatus(task.state).label}
        </Badge>
      )}
    </li>
  );

  const ordered = [...tasks].sort((left, right) => ORDER[left.state] - ORDER[right.state]);

  return (
    <Dialog label={`What ${title} is doing`} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        title={title}
        detail={
          tasks.length === 0 ? (
            'Nothing in the queue is tied to it yet.'
          ) : (
            <>
              <AnimatedNumber value={running} suffix=" running" /> ·{' '}
              <AnimatedNumber value={waiting + notYetQueued} suffix=" waiting" />
            </>
          )
        }
      />

      <DialogContent>
        <div className="flex flex-col gap-4">
          {progress.map((entry) => (
            <div key={entry.label} className="flex flex-col gap-1.5">
              {progress.length > 1 ? (
                <span className="text-xs text-text-muted">{entry.label}</span>
              ) : null}

              <ScanProgressBar
                label={entry.label}
                phase={entry.phase}
                processed={entry.processed}
                total={entry.total}
                item={entry.item ?? null}
              />
            </div>
          ))}

          {tasks.length === 0 && notYetQueued === 0 ? null : (
            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {ordered.filter(isActive).map(renderTask)}

              {notYetQueued === 0 ? null : (
                <li className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1 text-sm text-text-muted">
                    <AnimatedNumber value={notYetQueued} suffix=" more not started yet" />
                  </span>

                  <Badge size="sm" tone="quiet">
                    Waiting
                  </Badge>
                </li>
              )}

              {ordered.filter((task) => !isActive(task)).map(renderTask)}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

RunningWorkDialog.displayName = 'RunningWorkDialog';

export { RunningWorkDialog };

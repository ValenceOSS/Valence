import { Badge } from '@ValenceUI/Badge';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ScanProgressBar } from '@ValenceScreens/components/AdminArea/components/ScanProgressBar/ScanProgressBar';
import { describeQueueKind } from '@ValenceScreens/components/AdminArea/describeQueueKind';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';
import type { RunningWorkDialogProps } from './RunningWorkDialog.types';

/**
 * Everything one job is doing right now: how far along it is, and each task the transcoder's queue
 * has taken on for it, running or waiting, so a job that looks like a single line can be seen for
 * the many things it is.
 *
 * @param title - What the job is called.
 * @param isOpen - Whether the dialog is showing.
 * @param progress - How far along the job says it is, where it says.
 * @param tasks - The queue's tasks that belong to this job.
 * @param onClose - Called when the dialog is dismissed.
 */
const RunningWorkDialog = ({ title, isOpen, progress, tasks, onClose }: RunningWorkDialogProps) => {
  const running = tasks.filter((task) => task.state === 'running').length;

  return (
    <Dialog label={`What ${title} is doing`} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        title={title}
        detail={
          tasks.length === 0
            ? 'Nothing in the queue is tied to it yet.'
            : `${running.toString()} running · ${(tasks.length - running).toString()} waiting`
        }
      />

      <DialogContent>
        <div className="flex flex-col gap-4">
          {progress === null ? null : (
            <ScanProgressBar
              label={title}
              phase={progress.phase}
              processed={progress.processed}
              total={progress.total}
            />
          )}

          {tasks.length === 0 ? null : (
            <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-text" title={task.subject}>
                      {task.subject}
                    </span>
                    <span className="text-xs text-text-muted">{describeQueueKind(task.kind)}</span>
                  </span>

                  <Badge size="sm" tone={describeJobStatus(task.state).tone}>
                    {describeJobStatus(task.state).label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

RunningWorkDialog.displayName = 'RunningWorkDialog';

export { RunningWorkDialog };

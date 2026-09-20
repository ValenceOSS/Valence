import type { Job } from '@ValenceClient/admin/fetchAdmin';
import type { RunningProgress } from './RunningWorkDialog.types';

type WorkTally = { running: number; waiting: number; notYetQueued: number };

/**
 * Counts what a job has going and what is still to come. Work the job has not yet handed to the queue
 * is inferred from how far it says it has got, since the queue only knows what it has been given.
 *
 * @param progress - How far each piece of work says it is.
 * @param tasks - The queue's tasks that belong to the job.
 * @returns How many are running, how many wait in the queue, and how many have not been queued yet.
 */
const tallyWork = (progress: readonly RunningProgress[], tasks: readonly Job[]): WorkTally => {
  const running = tasks.filter((task) => task.state === 'running').length;
  const waiting = tasks.filter((task) => task.state === 'queued').length;

  const remaining = progress.reduce(
    (sum, entry) =>
      entry.total === null || entry.processed === null
        ? sum
        : sum + Math.max(0, entry.total - entry.processed),
    0,
  );

  return { running, waiting, notYetQueued: Math.max(0, remaining - running - waiting) };
};

export { tallyWork };
export type { WorkTally };

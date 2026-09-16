import type { JobQueue } from '@ValenceServer/jobs/JobQueue';
import type { MaintenanceService, QueuedJob } from './MaintenanceService';

type CreateDatabaseMaintenanceServiceOptions = {
  jobs: JobQueue;
};

/**
 * Queues a server-wide job under its own kind as a singleton, so pressing the same button twice
 * joins the run already queued rather than starting a second sweep beside it. Different kinds stay
 * independent: a cache cleanup and a session cleanup may run at once.
 *
 * One of a kind runs at a time, so asking twice gets nothing back the second time. The answer used
 * to be an invented id — `pending-<kind>` — which was worse than no answer: nothing has that id, so
 * reading its state says "unknown", the client reads unknown as finished and stops watching, and
 * the work carries on untracked. The job already doing it is found and returned instead.
 *
 * @param jobs - The queue to put it on.
 * @param kind - The job being asked for.
 * @returns The job doing the work, with no id only where there is none and none could be started.
 */
const enqueueSingleton = async (jobs: JobQueue, kind: string): Promise<QueuedJob> => {
  const jobId = await jobs.enqueue(kind, {}, kind);

  if (jobId !== null) {
    return { jobId, state: 'queued' };
  }

  const running = await jobs.liveJob(kind);

  return running === null
    ? { jobId: null, state: 'unavailable' }
    : { jobId: running, state: 'running' };
};

/**
 * The housekeeping an operator can ask for: sweeping the caches, clearing out stale sessions,
 * pruning what has aged out, and asking the transcoder and the catalogue whether they answer. Every
 * one of them is queued rather than run here, since none should hold a request open while it works.
 *
 * Takes the kind rather than offering a method per job, which is the whole of the fix. There was one
 * method for each, a matching entry in the route's own table, and a job definition — three lists
 * that had to agree, and adding a job only ever updated the third. Eight of the twelve server-wide
 * jobs had arrived that way by the time anybody pressed Run on one: the route found no entry, fell
 * through to the branch for work that needs a library, and answered "That job needs a library" with
 * a 404. The page read that as the job having finished the instant it began, and nothing was ever
 * queued, so nothing appeared in the history either.
 *
 * Nothing here decides which kinds are allowed. The caller holds the job definitions and is the only
 * place that knows what a real job is, so it checks before asking.
 *
 * @param jobs - The queue the work is put on.
 * @returns The maintenance service.
 */
const createDatabaseMaintenanceService = ({
  jobs,
}: CreateDatabaseMaintenanceServiceOptions): MaintenanceService => ({
  run: (kind) => enqueueSingleton(jobs, kind),
});

export { createDatabaseMaintenanceService };

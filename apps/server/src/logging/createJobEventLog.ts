import type { Logger } from './Logger';

type JobEventLog = {
  started: (entry: { kind: string; jobId: string; subject: string | null }) => void;
  progress: (entry: {
    jobId: string;
    phase: string;
    processed: number;
    total: number;
    item: string | null;
  }) => void;
  finished: (entry: {
    kind: string;
    jobId: string;
    reason: string | null;
    wasStopped?: boolean;
  }) => void;
};

type Run = { kind: string | null; startedAtMs: number; phase: string | null; step: number };

const STEPS = 10;

const seconds = (ms: number): string => `${(Math.round(ms / 100) / 10).toString()} s`;

/**
 * Writes down what a background job does as it does it: that it started, how far through it is at
 * each tenth of the way and whenever it moves on to another phase, and how it ended and how long it
 * took.
 *
 * Kept apart from the jobs themselves so every kind of job says these things, including the ones
 * that never learned to — a run whose only trace was a progress bar left nothing to read when it
 * stalled or failed, and a handler added later would have been as silent. Each line is given the job
 * it belongs to, since these are said from the queue's own callbacks rather than from inside the job.
 *
 * @param log - Where the lines are written.
 * A job that was already running when this began, or whose start was missed, is picked up at its
 * first report of progress, and said to be "a background job" until it says which it is at the end.
 *
 * @param labelFor - What a kind of job is called, in words.
 * @param nowMs - The present moment, which a test may set.
 * @returns What to tell about each thing a job does.
 */
const createJobEventLog = (
  log: Logger,
  labelFor: (kind: string) => string,
  nowMs: () => number = Date.now,
): JobEventLog => {
  const runs = new Map<string, Run>();

  return {
    started: ({ kind, jobId, subject }) => {
      runs.set(jobId, { kind, startedAtMs: nowMs(), phase: null, step: 0 });
      log.info('jobs', `${labelFor(kind)} started${subject === null ? '' : ` on ${subject}`}`, {
        context: { jobId, jobKind: kind },
      });
    },

    progress: ({ jobId, phase, processed, total, item }) => {
      const run = runs.get(jobId) ?? { kind: null, startedAtMs: nowMs(), phase: null, step: 0 };

      runs.set(jobId, run);

      const context = run.kind === null ? { jobId } : { jobId, jobKind: run.kind };
      const name = run.kind === null ? 'A background job' : labelFor(run.kind);

      if (item !== null) {
        log.debug('jobs', `${phase}: ${item}`, { context });
      }

      const step = total === 0 ? 0 : Math.floor((processed / total) * STEPS);
      const isNewPhase = run.phase !== phase;

      if (isNewPhase || step > run.step) {
        run.phase = phase;
        run.step = isNewPhase ? step : Math.max(run.step, step);
        log.info(
          'jobs',
          `${name}: ${phase} — ${processed.toLocaleString('en')} of ${total.toLocaleString('en')}`,
          { context },
        );
      }
    },

    finished: ({ kind, jobId, reason, wasStopped = false }) => {
      const run = runs.get(jobId);
      const took = run === undefined ? '' : ` after ${seconds(nowMs() - run.startedAtMs)}`;
      const context = { jobId, jobKind: kind };

      runs.delete(jobId);

      if (reason === null && wasStopped) {
        log.info('jobs', `${labelFor(kind)} stopped${took}`, { context });
      } else if (reason === null) {
        log.info('jobs', `${labelFor(kind)} finished${took}`, { context });
      } else {
        log.error('jobs', `${labelFor(kind)} failed${took}: ${reason}`, { context });
      }
    },
  };
};

export type { JobEventLog };

export { createJobEventLog };

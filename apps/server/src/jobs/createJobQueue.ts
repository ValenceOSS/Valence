import { randomUUID } from 'node:crypto';
import { and, asc, eq, gt, inArray, lt, lte, sql } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import { insertUnlessPresent } from '@ValenceDatabase/insertUnlessPresent';
import { upsert } from '@ValenceDatabase/upsert';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { jobSchedule, queuedJob } from '#dialect/Schema';
import { nextFiringOf } from './nextFiringOf';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { saying } from '@ValenceI18n/saying';
import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';
import { readJobPayload } from './readJobPayload';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { JobProgress, JobQueue, JobState } from './JobQueue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type JobHandler = (jobId: string, payload: { [key: string]: JsonValue }) => Promise<void>;

type FinishedJob = {
  kind: string;
  jobId: string;
  subject: string | null;
  reason: Said | null;
  wasStopped: boolean;
};

type KindOptions = {
  atOnce?: number;
  retries?: number;
};

type CreateJobQueueOptions = {
  db: AnyValenceDatabase;
  handlers: Record<string, JobHandler>;
  perKind?: Record<string, KindOptions>;
  pollEveryMs?: number;
  onProblem?: (message: string) => void;
  onStarted?: (entry: { kind: string; jobId: string; subject: string | null }) => Promise<void>;
  onProgress?: (entry: {
    jobId: string;
    phase: Said;
    processed: number;
    total: number;
    item: string | null;
  }) => void;
  onFinished?: (finished: FinishedJob) => void;
};

type QueuedJobRow = typeof queuedJob.$inferSelect;

const POLL_EVERY_MS = 1000;

const SCHEDULES_EVERY_MS = 15_000;

const FINISHED_KEPT_FOR_MS = 7 * 86_400_000;

const LONGEST_BACKOFF_SECONDS = 300;

const STOPPING_WAITS_MS = 30_000;

const SETTLED_STATES = ['completed', 'failed', 'cancelled'];

const STATES: Record<string, JobState> = {
  queued: 'queued',
  running: 'running',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'failed',
};

/**
 * Reads what a job is about from its own payload — which library, which item — so that progress and
 * failures can be reported against something an operator recognises rather than against an
 * identifier.
 *
 * @param payload - What it was enqueued with.
 * @returns What the job is about, or null where its payload names nothing.
 */
const subjectOf = (payload: { [key: string]: JsonValue }): string | null =>
  typeof payload['libraryId'] === 'string'
    ? payload['libraryId']
    : typeof payload['subject'] === 'string'
      ? payload['subject']
      : null;

/**
 * Works out how long a job that failed waits before it is tried again: twice as long each time, from
 * ten seconds, and never more than five minutes.
 *
 * @param attempts - How many times it has run.
 * @returns The wait, in seconds.
 */
const backoffSeconds = (attempts: number): number =>
  Math.min(LONGEST_BACKOFF_SECONDS, 5 * 2 ** attempts);

/**
 * Starts the job queue and registers a worker for every kind of background work Valence does — scans,
 * previews, thumbnails, artwork, webhook deliveries. Work outlives the request that asked for it and
 * survives a restart, which is the whole reason a queue exists rather than a promise.
 *
 * The queue lives in two tables of Valence's own database, so it runs on whichever database the server
 * does. A worker claims the oldest job that is due with a row lock that skips rows another claim holds,
 * and a job waiting under a key gives the key up the moment it is claimed, so a second one of its kind
 * can queue behind it while it runs. Schedules are rows too, each holding the next moment it fires;
 * whichever check moves that moment on first is the one that sends the job.
 *
 * `onStarted` is awaited and the other two are not, which is not an oversight. Everything said about
 * a run afterwards — its progress, and that it finished — is said about a row that has to exist
 * first, and these callbacks write to the database through a pool: two queries nobody waited for run
 * on whichever connections are free, in whichever order those finish. A job that takes milliseconds
 * therefore raced its own history. Waiting here puts the row in front of everything that amends it.
 *
 * @param options - The database to keep the queue in, and the handlers for each kind of job.
 * @returns The queue, ready to be enqueued against.
 */
const createJobQueue = ({
  db,
  handlers,
  perKind = {},
  pollEveryMs = POLL_EVERY_MS,
  onProblem,
  onStarted,
  onProgress,
  onFinished,
}: CreateJobQueueOptions): JobQueue => {
  const kinds = Object.keys(handlers);
  const progressByJobId = new Map<string, JobProgress>();
  const running = new Map<string, { kind: string; subject: string | null }>();
  const cancelled = new Set<string>();
  const busy = new Map<string, number>();
  const inFlight = new Set<Promise<void>>();
  const timers: NodeJS.Timeout[] = [];

  let isWorking = false;
  let isStopping = false;
  let isPolling = false;
  let pollsAgain = false;

  /**
   * Says what went wrong in the queue itself, as opposed to in a job.
   *
   * @param error - What was thrown.
   */
  const complain = (error: Error | string): void => {
    onProblem?.(error instanceof Error ? error.message : String(error));
  };

  /**
   * Takes the oldest job of a kind that is due, marking it running and giving up its key, or nothing
   * where none is waiting.
   *
   * @param kind - The kind to take one of.
   * @returns The job, as it now stands.
   */
  const claim = (kind: string): Promise<QueuedJobRow | undefined> =>
    db.transaction(async (tx) => {
      const [next] = await tx
        .select({ id: queuedJob.id })
        .from(queuedJob)
        .where(
          and(
            eq(queuedJob.kind, kind),
            eq(queuedJob.state, 'queued'),
            lte(queuedJob.runAfter, new Date()),
          ),
        )
        .orderBy(asc(queuedJob.runAfter), asc(queuedJob.createdAt))
        .limit(1)
        .for('update', { skipLocked: true });

      if (next === undefined) {
        return undefined;
      }

      await tx
        .update(queuedJob)
        .set({ state: 'running', waitingKey: null, attempts: sql`${queuedJob.attempts} + 1` })
        .where(eq(queuedJob.id, next.id));

      const [taken] = await tx.select().from(queuedJob).where(eq(queuedJob.id, next.id)).limit(1);

      return taken;
    });

  /**
   * Records how a job ended.
   *
   * @param jobId - The job.
   * @param state - How it ended.
   * @param reason - What went wrong, where something did.
   */
  const settle = async (
    jobId: string,
    state: 'completed' | 'failed' | 'cancelled',
    reason: string | null,
  ): Promise<void> => {
    await db
      .update(queuedJob)
      .set({ state, finishedAt: new Date(), ...(reason === null ? {} : { lastError: reason }) })
      .where(eq(queuedJob.id, jobId));
  };

  /**
   * Puts a job that failed back on its queue for a later try, or marks it failed for good once it has
   * had every try it was allowed.
   *
   * @param job - The job, as it was claimed.
   * @param reason - What went wrong.
   */
  const retryOrFail = async (job: QueuedJobRow, reason: string): Promise<void> => {
    if (job.attempts > job.retryLimit) {
      await settle(job.id, 'failed', reason);

      return;
    }

    await db
      .update(queuedJob)
      .set({
        state: 'queued',
        lastError: reason,
        runAfter: new Date(Date.now() + backoffSeconds(job.attempts) * 1000),
      })
      .where(eq(queuedJob.id, job.id));
  };

  /**
   * Runs one claimed job to the end, telling whoever is listening that it started and how it ended.
   *
   * @param kind - Its kind.
   * @param job - The job, as it was claimed.
   */
  const run = async (kind: string, job: QueuedJobRow): Promise<void> => {
    const handler = handlers[kind];
    const payload = readJobPayload(JsonValueSchema.catch(null).parse(job.payload));
    const subject = job.subject;

    running.set(job.id, { kind, subject });

    try {
      await onStarted?.({ kind, jobId: job.id, subject });

      if (handler !== undefined) {
        await handler(job.id, payload);
      }

      onFinished?.({
        kind,
        jobId: job.id,
        subject,
        reason: null,
        wasStopped: cancelled.has(job.id),
      });

      await settle(job.id, 'completed', null);
    } catch (error) {
      const wasStopped = cancelled.has(job.id);
      const reason =
        error instanceof SaidError
          ? error.said
          : error instanceof Error
            ? sayVerbatim(error.message)
            : saying('server.jobs.jobQueue.theJobFailed');

      onFinished?.({
        kind,
        jobId: job.id,
        subject,
        reason: wasStopped ? null : reason,
        wasStopped,
      });

      await (wasStopped ? settle(job.id, 'cancelled', null) : retryOrFail(job, reason.message));
    } finally {
      running.delete(job.id);
      progressByJobId.delete(job.id);
      cancelled.delete(job.id);
    }
  };

  /**
   * Starts a claimed job without waiting for it, holding one of its kind's places until it ends and
   * looking for more work as soon as it does.
   *
   * @param kind - Its kind.
   * @param job - The job, as it was claimed.
   */
  const begin = (kind: string, job: QueuedJobRow): void => {
    busy.set(kind, (busy.get(kind) ?? 0) + 1);

    const settled = run(kind, job)
      .catch(complain)
      .finally(() => {
        busy.set(kind, (busy.get(kind) ?? 1) - 1);
        inFlight.delete(settled);
        void poll();
      });

    inFlight.add(settled);
  };

  /**
   * Claims and starts as much due work as every kind has room for.
   */
  const claimWhatFits = async (): Promise<void> => {
    for (const kind of kinds) {
      const room = perKind[kind]?.atOnce ?? 1;

      while (!isStopping && (busy.get(kind) ?? 0) < room) {
        const job = await claim(kind);

        if (job === undefined) {
          break;
        }

        begin(kind, job);
      }
    }
  };

  /**
   * Looks for work. A look asked for while one is already going makes that one look again once it
   * is done, rather than running beside it.
   */
  const poll = async (): Promise<void> => {
    if (!isWorking || isStopping) {
      return;
    }

    if (isPolling) {
      pollsAgain = true;

      return;
    }

    isPolling = true;

    try {
      await claimWhatFits();
    } catch (error) {
      complain(error instanceof Error ? error : String(error));
    } finally {
      isPolling = false;
    }

    if (pollsAgain) {
      pollsAgain = false;
      await poll();
    }
  };

  /**
   * Sends the job for every schedule whose moment has come and moves each on to its next, then
   * forgets jobs that ended long enough ago that nobody will ask about them.
   */
  const fireSchedules = async (): Promise<void> => {
    const now = new Date();
    const due = await db.select().from(jobSchedule).where(lte(jobSchedule.nextRunAt, now));

    for (const schedule of due) {
      try {
        const moved = await db
          .update(jobSchedule)
          .set({ nextRunAt: nextFiringOf(schedule.cron, schedule.timezone, now) })
          .where(
            and(
              eq(jobSchedule.queueName, schedule.queueName),
              eq(jobSchedule.key, schedule.key),
              eq(jobSchedule.nextRunAt, schedule.nextRunAt),
            ),
          );

        if (countAffected(moved) > 0) {
          await send(schedule.queueName, {}, schedule.queueName, undefined);
        }
      } catch (error) {
        complain(error instanceof Error ? error : String(error));
      }
    }

    await db
      .delete(queuedJob)
      .where(
        and(
          inArray(queuedJob.state, SETTLED_STATES),
          lt(queuedJob.finishedAt, new Date(now.getTime() - FINISHED_KEPT_FOR_MS)),
        ),
      );
  };

  /**
   * Puts a job on its queue, optionally under a key that keeps a second of its kind from waiting
   * behind it and optionally held back for a while.
   *
   * @param kind - The queue to put it on.
   * @param payload - What the job needs to know.
   * @param singletonKey - What it collapses against, where it should collapse at all.
   * @param startAfter - How many seconds to leave it before it may be picked up.
   * @returns The id of the job, or null where something already held the key.
   */
  const send = async (
    kind: string,
    payload: { [key: string]: JsonValue },
    singletonKey: string | undefined,
    startAfter: number | undefined,
  ): Promise<string | null> => {
    const id = randomUUID();
    const values = {
      id,
      kind,
      payload,
      subject: subjectOf(payload),
      state: 'queued',
      waitingKey: singletonKey ?? null,
      retryLimit: perKind[kind]?.retries ?? 2,
      runAfter: new Date(Date.now() + (startAfter ?? 0) * 1000),
    };

    if (singletonKey === undefined) {
      await db.insert(queuedJob).values(values);
    } else {
      await insertUnlessPresent(db, queuedJob, {
        values: [values],
        target: [queuedJob.kind, queuedJob.waitingKey],
      });

      const [kept] = await db
        .select({ id: queuedJob.id })
        .from(queuedJob)
        .where(eq(queuedJob.id, id))
        .limit(1);

      if (kept === undefined) {
        return null;
      }
    }

    if (startAfter === undefined) {
      void poll();
    }

    return id;
  };

  /**
   * Reads where a job has got to.
   *
   * @param jobId - The job.
   * @returns Its state, or nothing where there is no such job.
   */
  const stateOf = async (jobId: string): Promise<string | null> => {
    const [row] = await db
      .select({ state: queuedJob.state })
      .from(queuedJob)
      .where(eq(queuedJob.id, jobId))
      .limit(1);

    return row?.state ?? null;
  };

  return {
    startWorking: async () => {
      await db
        .update(queuedJob)
        .set({
          state: 'failed',
          finishedAt: new Date(),
          // oxlint-disable-next-line valence/no-hard-coded-strings -- kept in the queue's own table for whoever reads it, never shown
          lastError: 'The server stopped.',
        })
        .where(and(eq(queuedJob.state, 'running'), gt(queuedJob.attempts, queuedJob.retryLimit)));

      await db.update(queuedJob).set({ state: 'queued' }).where(eq(queuedJob.state, 'running'));

      isWorking = true;

      timers.push(
        setInterval(() => {
          void poll();
        }, pollEveryMs),
        setInterval(() => {
          fireSchedules().catch(complain);
        }, SCHEDULES_EVERY_MS),
      );

      for (const timer of timers) {
        timer.unref();
      }

      await fireSchedules().catch(complain);
      await poll();
    },

    enqueue: (kind, payload, singletonKey) => send(kind, payload, singletonKey, undefined),

    enqueueAfter: (kind, payload, seconds, singletonKey) =>
      send(kind, payload, singletonKey, seconds),

    readState: async (jobId) => {
      const state = await stateOf(jobId);

      return state === null ? 'unknown' : (STATES[state] ?? 'unknown');
    },

    readProgress: (jobId) => progressByJobId.get(jobId) ?? null,

    listRunning: () =>
      [...running].map(([jobId, about]) => ({
        jobId,
        kind: about.kind,
        subject: about.subject,
        progress: progressByJobId.get(jobId) ?? null,
      })),

    liveJob: async (kind, subject) => {
      for (const [jobId, about] of running) {
        if (about.kind === kind && (subject === undefined || about.subject === subject)) {
          return jobId;
        }
      }

      const [waiting] = await db
        .select({ id: queuedJob.id })
        .from(queuedJob)
        .where(
          and(
            eq(queuedJob.kind, kind),
            eq(queuedJob.state, 'queued'),
            subject === undefined ? undefined : eq(queuedJob.subject, subject),
          ),
        )
        .orderBy(asc(queuedJob.createdAt))
        .limit(1);

      return waiting?.id ?? null;
    },

    cancel: async (jobId) => {
      if (running.has(jobId)) {
        cancelled.add(jobId);

        return true;
      }

      const dropped = await db
        .update(queuedJob)
        .set({ state: 'cancelled', finishedAt: new Date() })
        .where(and(eq(queuedJob.id, jobId), eq(queuedJob.state, 'queued')));

      if (countAffected(dropped) > 0) {
        return true;
      }

      if ((await stateOf(jobId)) === 'running') {
        cancelled.add(jobId);

        return true;
      }

      return false;
    },

    cancelFor: async (subject) => {
      let stopped = 0;

      for (const [jobId, about] of running) {
        if (about.subject === subject) {
          cancelled.add(jobId);
          stopped += 1;
        }
      }

      const dropped = await db
        .update(queuedJob)
        .set({ state: 'cancelled', finishedAt: new Date() })
        .where(and(eq(queuedJob.subject, subject), eq(queuedJob.state, 'queued')));

      return stopped + countAffected(dropped);
    },

    isCancelled: (jobId) => cancelled.has(jobId),

    reportProgress: (jobId, phase, processed, total, item = null) => {
      progressByJobId.set(jobId, { phase, processed, total, item });
      onProgress?.({ jobId, phase, processed, total, item });
    },

    setSchedule: async (queueName, key, cron, timezone) => {
      const nextRunAt = nextFiringOf(cron, timezone, new Date());

      await upsert(db, jobSchedule, {
        values: [{ queueName, key, cron, timezone, nextRunAt }],
        target: [jobSchedule.queueName, jobSchedule.key],
        set: { cron, timezone, nextRunAt },
      });
    },

    clearSchedule: async (queueName, key) => {
      await db
        .delete(jobSchedule)
        .where(and(eq(jobSchedule.queueName, queueName), eq(jobSchedule.key, key)));
    },

    listSchedules: async () => {
      const schedules = await db.select().from(jobSchedule);

      return schedules.map((schedule) => ({
        queueName: schedule.queueName,
        key: schedule.key,
        cron: schedule.cron,
        timezone: schedule.timezone,
      }));
    },

    stop: async () => {
      isStopping = true;

      for (const timer of timers) {
        clearInterval(timer);
      }

      await Promise.race([
        Promise.allSettled(inFlight),
        new Promise((resolve) => {
          setTimeout(resolve, STOPPING_WAITS_MS).unref();
        }),
      ]);
    },
  };
};

export type { FinishedJob, JobHandler };

export { createJobQueue };

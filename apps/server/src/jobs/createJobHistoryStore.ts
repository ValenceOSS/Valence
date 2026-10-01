import { z } from 'zod';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import type { Said } from '@ValenceI18n/SaidSchema';
import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, gte, isNotNull, lt, lte, or, sql } from 'drizzle-orm';
import { containsInsensitively } from '@ValenceDatabase/containsInsensitively';
import { countAffected } from '@ValenceDatabase/countAffected';
import { countWhere } from '@ValenceDatabase/countWhere';
import { jsonAsText } from '@ValenceDatabase/jsonAsText';
import { likeLiterally } from '@ValenceDatabase/likeLiterally';
import { millisecondsBetween } from '@ValenceDatabase/millisecondsBetween';
import { nullsLast } from '@ValenceDatabase/nullsLast';
import { upsert } from '@ValenceDatabase/upsert';
import { jobRun, jobRunIssue } from '#dialect/Schema';
import {
  JOB_RUN_KEPT_FOR_DAYS,
  JobRunProgressSchema,
  JobRunStatusSchema,
} from '@ValenceContracts/schemas/JobRun';
import type { SQL } from 'drizzle-orm';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  JobKindStats,
  JobRunIssue,
  JobRunProgress,
  JobRunQuery,
  JobRunRecord,
  JobRunStatus,
} from '@ValenceContracts/schemas/JobRun';

type JobHistoryStore = {
  recordStarted: (entry: { id: string; kind: string; subject: string | null }) => Promise<void>;
  recordProgress: (entry: { id: string; progress: JobRunProgress }) => Promise<void>;
  recordIssue: (entry: { jobRunId: string; path: string; reason: Said }) => Promise<void>;
  recordFinished: (entry: {
    id: string;
    status: Extract<JobRunStatus, 'completed' | 'failed' | 'stopped'>;
    errorMessage: Said | null;
  }) => Promise<void>;
  read: (query: JobRunQuery) => Promise<{ records: JobRunRecord[]; total: number }>;
  interruptRunning: (reason: Said) => Promise<number>;
  readOne: (jobRunId: string) => Promise<JobRunRecord | null>;
  readIssues: (jobRunId: string) => Promise<JobRunIssue[]>;
  readStats: (sinceMs: number) => Promise<JobKindStats[]>;
  forgetExpired: (nowMs: number) => Promise<void>;
};

type JobRunRow = typeof jobRun.$inferSelect;

type JobRunIssueRow = typeof jobRunIssue.$inferSelect;

const asRecord = (row: JobRunRow): JobRunRecord => ({
  id: row.id,
  kind: row.kind,
  status: JobRunStatusSchema.catch('queued').parse(row.status),
  subject: row.subject,
  startedAtMs: row.startedAt === null ? null : row.startedAt.getTime(),
  finishedAtMs: row.finishedAt === null ? null : row.finishedAt.getTime(),
  progress: StoredProgressSchema.nullable().catch(null).parse(row.progress),
  errorMessage: row.errorMessage,
  createdAtMs: row.createdAt.getTime(),
});

const asIssue = (row: JobRunIssueRow): JobRunIssue => ({
  id: row.id,
  jobRunId: row.jobRunId,
  path: row.path,
  reason: row.reason,
  atMs: row.atMs,
});

/**
 * The conditions a history listing is filtered by, shared between reading the page itself and
 * counting how many rows match it in total.
 *
 * @param query - What to filter the listing by.
 * @returns The condition every matching row satisfies, or nothing where the query filters by nothing.
 */
const whereFor = (query: JobRunQuery): SQL | undefined => {
  const pattern = `%${likeLiterally(query.search)}%`;
  const wheres = [
    query.kind === null ? undefined : eq(jobRun.kind, query.kind),
    query.status === null ? undefined : eq(jobRun.status, query.status),
    query.search === ''
      ? undefined
      : or(
          containsInsensitively(jobRun.id, pattern),
          containsInsensitively(jobRun.kind, pattern),
          containsInsensitively(jobRun.subject, pattern),
          containsInsensitively(jsonAsText(jobRun.errorMessage), pattern),
        ),
    query.sinceMs === null
      ? undefined
      : query.runningFirst
        ? or(gte(jobRun.createdAt, new Date(query.sinceMs)), eq(jobRun.status, 'running'))
        : gte(jobRun.createdAt, new Date(query.sinceMs)),
    query.untilMs === null ? undefined : lte(jobRun.createdAt, new Date(query.untilMs)),
  ].filter((one) => one !== undefined);

  return wheres.length === 0 ? undefined : and(...wheres);
};

const TOOK = millisecondsBetween(jobRun.finishedAt, jobRun.startedAt);

const RUNNING_FIRST = sql`case when ${jobRun.status} = 'running' then 0 else 1 end`;

/**
 * What a page of runs is ordered by. Ties always fall to the newest first.
 *
 * Where the history asks for it — as it does when it opens, before anybody has sorted or filtered it
 * — a run still going comes first, so work that takes hours stays on the first page rather than
 * sinking under every short run that finished since it began. Once an operator has sorted or
 * filtered, the order is exactly what they asked for.
 *
 * @param query - How the operator asked for the runs to be ordered, and whether running ones lead.
 * @returns The ordering, from most to least significant.
 */
const orderingFor = (query: JobRunQuery): SQL[] => {
  const leading = query.runningFirst ? [RUNNING_FIRST] : [];

  switch (query.sort) {
    case 'oldest':
      return [...leading, asc(jobRun.createdAt), asc(jobRun.id)];
    case 'longest':
      return [...leading, nullsLast(TOOK, 'desc'), desc(jobRun.createdAt), desc(jobRun.id)];
    case 'newest':
      return [...leading, desc(jobRun.createdAt), desc(jobRun.id)];
  }
};

/**
 * Builds the filtered, paginated selection a history listing reads from, without running it.
 *
 * @param db - The database to query.
 * @param query - What to filter the listing by.
 * @returns The select query, ready to be awaited.
 */
const buildReadQuery = (db: AnyValenceDatabase, query: JobRunQuery) =>
  db
    .select()
    .from(jobRun)
    .where(whereFor(query))
    .orderBy(...orderingFor(query))
    .limit(query.limit)
    .offset(query.offset);

/**
 * Reads a duration the database gave back — a string for an exact number, a number for a
 * floating-point one, and nothing where there was no finished run to measure.
 *
 * @param value - What the database returned.
 * @returns The duration in milliseconds, or nothing.
 */
const asMilliseconds = (value: string | number | null): number | null => {
  const read = value === null ? Number.NaN : Number(value);

  return Number.isFinite(read) ? read : null;
};

/**
 * Builds the query that stops every run still marked as running or waiting, without running it.
 *
 * A run is marked as running by the process doing it, and only that process can mark it finished, so
 * one whose process went away — a restart, a crash — is marked running for ever. The server does this
 * as it starts, before anything can be running, and a run that is delivered again afterwards marks
 * itself as running once more.
 *
 * @param db - The database to update.
 * @param reason - Why the runs were stopped, kept with each.
 * @returns The update query, ready to be awaited.
 */
const buildInterruptQuery = (db: AnyValenceDatabase, reason: Said) =>
  db
    .update(jobRun)
    .set({ status: 'stopped', finishedAt: new Date(), errorMessage: reason })
    .where(sql`${jobRun.status} in ('running', 'queued')`);

/**
 * Builds the query that summarises how each kind of job has gone since a moment, without running it:
 * how many runs there were and how they ended, how long the typical one took and the slowest.
 *
 * @param db - The database to query.
 * @param sinceMs - The earliest a counted run was created.
 * @returns The select query, ready to be awaited.
 */
const buildStatsQuery = (db: AnyValenceDatabase, sinceMs: number) =>
  db
    .select({
      kind: jobRun.kind,
      runs: count(),
      completed: countWhere(sql`${jobRun.status} = 'completed'`),
      failed: countWhere(sql`${jobRun.status} = 'failed'`),
      running: countWhere(sql`${jobRun.status} in ('running', 'queued')`),
      slowestMs: sql<string | number | null>`max(${TOOK})`,
      lastAt: sql<Date | null>`max(${jobRun.createdAt})`,
    })
    .from(jobRun)
    .where(gte(jobRun.createdAt, new Date(sinceMs)))
    .groupBy(jobRun.kind)
    .orderBy(jobRun.kind);

/**
 * Builds the query that reads how long each finished run since a moment took, without running it,
 * for the typical run of each kind to be worked out from — a median, which not every database can
 * take for itself.
 *
 * @param db - The database to query.
 * @param sinceMs - The earliest a counted run was created.
 * @returns The select query, ready to be awaited.
 */
const buildDurationsQuery = (db: AnyValenceDatabase, sinceMs: number) =>
  db
    .select({ kind: jobRun.kind, took: TOOK })
    .from(jobRun)
    .where(
      and(
        gte(jobRun.createdAt, new Date(sinceMs)),
        isNotNull(jobRun.startedAt),
        isNotNull(jobRun.finishedAt),
      ),
    );

/**
 * Finds the middle of some durations, halfway between the two middle ones where there is an even
 * number of them.
 *
 * @param durations - The durations, in any order.
 * @returns The median, or nothing where there were none.
 */
const medianOf = (durations: number[]): number | null => {
  const sorted = durations.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];

  if (upper === undefined) {
    return null;
  }

  const lower = sorted.length % 2 === 0 ? sorted[middle - 1] : upper;

  return lower === undefined ? upper : (lower + upper) / 2;
};

/**
 * Keeps job runs in the database, so what a job did survives the job finishing and a restart.
 *
 * The queue forgets a job once it settles, which is why the "Running" badge could show nothing was
 * queued while work was genuinely happening: there was nowhere to read it back from. This is that
 * place, plus the per-item issues a bulk job accumulates, which previously only ever became a log
 * line and were never gathered against the run that produced them.
 *
 * @param db - The database.
 * @returns The store.
 */
const createJobHistoryStore = (db: AnyValenceDatabase): JobHistoryStore => ({
  recordStarted: async (entry) => {
    await upsert(db, jobRun, {
      values: [
        {
          id: entry.id,
          kind: entry.kind,
          status: 'running',
          subject: entry.subject,
          startedAt: new Date(),
        },
      ],
      target: jobRun.id,
      set: {
        status: 'running',
        subject: entry.subject,
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      },
    });
  },

  recordProgress: async (entry) => {
    await db.update(jobRun).set({ progress: entry.progress }).where(eq(jobRun.id, entry.id));
  },

  recordIssue: async (entry) => {
    await db.insert(jobRunIssue).values({
      id: randomUUID(),
      jobRunId: entry.jobRunId,
      path: entry.path,
      reason: entry.reason,
      atMs: Date.now(),
    });
  },

  recordFinished: async (entry) => {
    await db
      .update(jobRun)
      .set({ status: entry.status, finishedAt: new Date(), errorMessage: entry.errorMessage })
      .where(eq(jobRun.id, entry.id));
  },

  read: async (query) => {
    const rows = await buildReadQuery(db, query);
    const [counted] = await db.select({ total: count() }).from(jobRun).where(whereFor(query));

    return { records: rows.map(asRecord), total: Number(counted?.total ?? 0) };
  },

  interruptRunning: async (reason) => countAffected(await buildInterruptQuery(db, reason)),

  readOne: async (jobRunId) => {
    const [row] = await db.select().from(jobRun).where(eq(jobRun.id, jobRunId)).limit(1);

    return row === undefined ? null : asRecord(row);
  },

  readStats: async (sinceMs) => {
    const rows = await buildStatsQuery(db, sinceMs);
    const durations = await buildDurationsQuery(db, sinceMs);

    return rows.map((row) => ({
      kind: row.kind,
      runs: Number(row.runs),
      completed: row.completed,
      failed: row.failed,
      running: row.running,
      medianMs: medianOf(durations.filter((one) => one.kind === row.kind).map((one) => one.took)),
      slowestMs: asMilliseconds(row.slowestMs),
      lastAtMs: row.lastAt === null ? null : new Date(row.lastAt).getTime(),
    }));
  },

  readIssues: async (jobRunId) => {
    const rows = await db
      .select()
      .from(jobRunIssue)
      .where(eq(jobRunIssue.jobRunId, jobRunId))
      .orderBy(desc(jobRunIssue.atMs));

    return rows.map(asIssue);
  },

  forgetExpired: async (nowMs) => {
    await db
      .delete(jobRun)
      .where(lt(jobRun.createdAt, new Date(nowMs - JOB_RUN_KEPT_FOR_DAYS * 86_400_000)));
  },
});

export type { JobHistoryStore };

export {
  createJobHistoryStore,
  buildReadQuery,
  buildStatsQuery,
  buildInterruptQuery,
  asMilliseconds,
  asRecord,
  asIssue,
};
const StoredProgressSchema = JobRunProgressSchema.extend({
  phase: z.union([SaidSchema, z.string().transform(sayVerbatim)]),
});

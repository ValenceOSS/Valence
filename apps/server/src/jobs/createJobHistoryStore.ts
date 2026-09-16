import { randomUUID } from 'node:crypto';
import { and, count, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { jobRun, jobRunIssue } from '@ValenceServer/db/Schema';
import {
  JOB_RUN_KEPT_FOR_DAYS,
  JobRunProgressSchema,
  JobRunStatusSchema,
} from '@ValenceContracts/schemas/JobRun';
import type { SQL } from 'drizzle-orm';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type {
  JobRunIssue,
  JobRunProgress,
  JobRunQuery,
  JobRunRecord,
  JobRunStatus,
} from '@ValenceContracts/schemas/JobRun';

type JobHistoryStore = {
  recordStarted: (entry: { id: string; kind: string; subject: string | null }) => Promise<void>;
  recordProgress: (entry: { id: string; progress: JobRunProgress }) => Promise<void>;
  recordIssue: (entry: { jobRunId: string; path: string; reason: string }) => Promise<void>;
  recordFinished: (entry: {
    id: string;
    status: Extract<JobRunStatus, 'completed' | 'failed'>;
    errorMessage: string | null;
  }) => Promise<void>;
  read: (query: JobRunQuery) => Promise<{ records: JobRunRecord[]; total: number }>;
  readIssues: (jobRunId: string) => Promise<JobRunIssue[]>;
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
  progress: JobRunProgressSchema.nullable().catch(null).parse(row.progress),
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
  const wheres = [
    query.kind === null ? undefined : eq(jobRun.kind, query.kind),
    query.status === null ? undefined : eq(jobRun.status, query.status),
    query.search === ''
      ? undefined
      : sql`${jobRun.kind} ILIKE ${`%${query.search}%`} OR ${jobRun.subject} ILIKE ${`%${query.search}%`} OR ${jobRun.errorMessage} ILIKE ${`%${query.search}%`}`,
    query.sinceMs === null ? undefined : gte(jobRun.createdAt, new Date(query.sinceMs)),
  ].filter((one) => one !== undefined);

  return wheres.length === 0 ? undefined : and(...wheres);
};

/**
 * Builds the filtered, paginated selection a history listing reads from, without running it.
 *
 * @param db - The database to query.
 * @param query - What to filter the listing by.
 * @returns The select query, ready to be awaited.
 */
const buildReadQuery = (db: ValenceDatabase, query: JobRunQuery) =>
  db
    .select()
    .from(jobRun)
    .where(whereFor(query))
    .orderBy(desc(jobRun.createdAt))
    .limit(query.limit);

/**
 * Keeps pg-boss job runs in Postgres, so what a job did survives the job finishing and a restart.
 *
 * pg-boss forgets a job once it settles, which is why the "Running" badge could show nothing was
 * queued while work was genuinely happening: there was nowhere to read it back from. This is that
 * place, plus the per-item issues a bulk job accumulates, which previously only ever became a log
 * line and were never gathered against the run that produced them.
 *
 * @param db - The database.
 * @returns The store.
 */
const createJobHistoryStore = (db: ValenceDatabase): JobHistoryStore => ({
  recordStarted: async (entry) => {
    await db
      .insert(jobRun)
      .values({
        id: entry.id,
        kind: entry.kind,
        status: 'running',
        subject: entry.subject,
        startedAt: new Date(),
      })
      .onConflictDoUpdate({
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

export { createJobHistoryStore, buildReadQuery, whereFor, asRecord, asIssue };

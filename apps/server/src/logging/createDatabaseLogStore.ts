import { count, eq, lt, min, sql } from 'drizzle-orm';
import { logRecord } from '@ValenceServer/db/Schema';
import { binHistogram } from './binHistogram';
import { buildLogFacetQuery } from './buildLogFacetQuery';
import { buildLogHistogramQuery } from './buildLogHistogramQuery';
import { buildLogReadQuery } from './buildLogReadQuery';
import { histogramWindow } from './histogramWindow';
import { logFilterFor } from './logFilterFor';
import { LogLevelSchema, LogSourceSchema } from '@ValenceContracts/schemas/Log';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { LogQuery, LogRecord } from '@ValenceContracts/schemas/Log';
import type { LogStore, StoredLog } from './Logger';

type Row = typeof logRecord.$inferSelect;

const asRecord = (row: Row): LogRecord => ({
  id: row.id,
  atMs: row.at.getTime(),
  level: LogLevelSchema.catch('info').parse(row.level),
  source: LogSourceSchema.catch('server').parse(row.source),
  message: row.message,
  detail: row.detail,
  count: row.count,
  context: {
    jobId: row.jobId,
    jobKind: row.jobKind,
    libraryId: row.libraryId,
    mediaId: row.mediaId,
    sessionId: row.sessionId,
    requestId: row.requestId,
  },
});

/**
 * Keeps log records in Postgres, where they can be searched with the tools already in use rather
 * than needing a reading path of their own.
 *
 * Reads are bounded and ordered newest first unless asked otherwise, because the question an operator has is almost always
 * about what just happened, and an unbounded query against a table that grows all day is its own
 * outage.
 *
 * @param db - The database.
 * @returns The store.
 */
const createDatabaseLogStore = (db: ValenceDatabase): LogStore => ({
  save: async (records: readonly StoredLog[]) => {
    if (records.length === 0) {
      return;
    }

    await db.insert(logRecord).values(
      records.map((record) => ({
        id: record.id,
        at: new Date(record.atMs),
        level: record.level,
        source: record.source,
        message: record.message,
        detail: record.detail,
        count: 1,
        sameEventKey: record.sameEventKey,
        jobId: record.context.jobId,
        jobKind: record.context.jobKind,
        libraryId: record.context.libraryId,
        mediaId: record.context.mediaId,
        sessionId: record.context.sessionId,
        requestId: record.context.requestId,
        forgetAfter: new Date(record.forgetAfterMs),
      })),
    );
  },

  countAgain: async (ids: readonly string[]) => {
    if (ids.length === 0) {
      return;
    }

    const tally = new Map<string, number>();

    for (const id of ids) {
      tally.set(id, (tally.get(id) ?? 0) + 1);
    }

    for (const [id, more] of tally) {
      await db
        .update(logRecord)
        .set({ count: sql`${logRecord.count} + ${more}` })
        .where(eq(logRecord.id, id));
    }
  },

  read: async (query: LogQuery) => {
    const rows = await buildLogReadQuery(db, query);
    const [counted] = await db
      .select({ total: count() })
      .from(logRecord)
      .where(logFilterFor(query));

    return { records: rows.map(asRecord), total: Number(counted?.total ?? 0) };
  },

  histogram: async (query, nowMs) => {
    const [earliest] = await db
      .select({ at: min(logRecord.at) })
      .from(logRecord)
      .where(logFilterFor({ ...query, sinceMs: null }));
    const window = histogramWindow(query, earliest?.at?.getTime() ?? null, nowMs, query.buckets);
    const rows = await buildLogHistogramQuery(
      db,
      { ...query, sinceMs: window.fromMs, untilMs: window.untilMs },
      window.bucketMs,
    );

    return { ...window, buckets: binHistogram(rows, window) };
  },

  facets: async (query) => {
    const [sources, jobKinds] = await Promise.all([
      buildLogFacetQuery(db, query, logRecord.source),
      buildLogFacetQuery(db, query, logRecord.jobKind),
    ]);

    return {
      sources: sources.flatMap((row) => (row.value === null ? [] : [{ ...row, value: row.value }])),
      jobKinds: jobKinds.flatMap((row) =>
        row.value === null ? [] : [{ ...row, value: row.value }],
      ),
    };
  },

  forgetExpired: async (nowMs: number) => {
    const gone = await db
      .delete(logRecord)
      .where(lt(logRecord.forgetAfter, new Date(nowMs)))
      .returning({ id: logRecord.id });

    return gone.length;
  },
});

export { createDatabaseLogStore };

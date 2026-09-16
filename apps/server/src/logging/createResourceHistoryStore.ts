import { asc, gte, lt } from 'drizzle-orm';
import { resourceSample } from '@ValenceServer/db/Schema';
import {
  RESOURCE_SAMPLE_KEPT_FOR_DAYS,
  sinceMsForRange,
} from '@ValenceContracts/schemas/ResourceSample';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type {
  ResourceSampleRange,
  ResourceSampleRecord,
} from '@ValenceContracts/schemas/ResourceSample';

type ResourceHistoryStore = {
  record: (sample: {
    id: string;
    atMs: number;
    systemCpuPercent: number;
    loadAverage: number;
    systemMemoryUsedBytes: number;
    systemMemoryTotalBytes: number;
    cpuCount: number;
  }) => Promise<void>;
  read: (range: ResourceSampleRange) => Promise<ResourceSampleRecord[]>;
  forgetExpired: (nowMs: number) => Promise<void>;
};

type ResourceSampleRow = typeof resourceSample.$inferSelect;

const asRecord = (row: ResourceSampleRow): ResourceSampleRecord => ({
  id: row.id,
  atMs: row.atMs,
  systemCpuPercent: row.systemCpuPercent,
  loadAverage: row.loadAverage,
  systemMemoryUsedBytes: row.systemMemoryUsedBytes,
  systemMemoryTotalBytes: row.systemMemoryTotalBytes,
  cpuCount: row.cpuCount,
});

/**
 * Builds the range-bounded selection a history reading reads from, without running it.
 *
 * @param db - The database to query.
 * @param range - How far back to reach.
 * @param nowMs - The moment the range is measured from.
 * @returns The select query, ready to be awaited.
 */
const buildReadQuery = (db: ValenceDatabase, range: ResourceSampleRange, nowMs: number) =>
  db
    .select()
    .from(resourceSample)
    .where(gte(resourceSample.atMs, sinceMsForRange(range, nowMs)))
    .orderBy(asc(resourceSample.atMs));

/**
 * Keeps a history of what the machine has cost, so the load card can show more than the last minute
 * it has been open for.
 *
 * Sampled far more coarsely than the live reading it is drawn from — once a minute rather than once a
 * second — since a week of history at one sample a second would be tens of millions of rows for a
 * number nobody reads back that finely.
 *
 * @param db - The database.
 * @returns The store.
 */
const createResourceHistoryStore = (db: ValenceDatabase): ResourceHistoryStore => ({
  record: async (sample) => {
    await db.insert(resourceSample).values(sample);
  },

  read: async (range) => {
    const rows = await buildReadQuery(db, range, Date.now());

    return rows.map(asRecord);
  },

  forgetExpired: async (nowMs) => {
    await db
      .delete(resourceSample)
      .where(lt(resourceSample.atMs, nowMs - RESOURCE_SAMPLE_KEPT_FOR_DAYS * 86_400_000));
  },
});

export type { ResourceHistoryStore };

export { createResourceHistoryStore, buildReadQuery, asRecord };

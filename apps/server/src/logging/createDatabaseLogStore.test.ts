import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  LogFacetsQuerySchema,
  LogHistogramQuerySchema,
  LogQuerySchema,
} from '@ValenceContracts/schemas/Log';
import { createDatabaseLogStore } from './createDatabaseLogStore';
import type { StoredLog } from './Logger';

const STARTING_POSTGRES_MS = 60_000;

const NOW_MS = Date.UTC(2026, 8, 30, 12);

const A_MINUTE = 60_000;

const NO_CONTEXT = {
  jobId: null,
  jobKind: null,
  libraryId: null,
  mediaId: null,
  sessionId: null,
  requestId: null,
};

/**
 * A record as the logger would hand it to the store.
 *
 * @param id - What it is called.
 * @param change - What differs from a plain warning a minute before now.
 * @returns The record.
 */
const aRecord = (id: string, change: Partial<StoredLog> = {}): StoredLog => ({
  id,
  atMs: NOW_MS - A_MINUTE,
  level: 'warn',
  source: 'server',
  message: `record ${id}`,
  detail: null,
  context: NO_CONTEXT,
  sameEventKey: id,
  forgetAfterMs: NOW_MS + A_MINUTE,
  ...change,
});

describe('createDatabaseLogStore', () => {
  it(
    'finds records by a fragment of their text whatever its case, and by an identifier',
    async () => {
      const store = createDatabaseLogStore(await aMigratedDatabase());

      await store.save([
        aRecord('a', { message: 'Scan FAILED for Films' }),
        aRecord('b', { message: 'scan finished', detail: 'nothing failed' }),
        aRecord('c', { context: { ...NO_CONTEXT, jobId: 'job-9f3a' } }),
        aRecord('d', { message: 'all quiet' }),
      ]);

      const find = async (search: string) =>
        (await store.read(LogQuerySchema.parse({ search }))).records.map((one) => one.id).sort();

      expect(await find('failed')).toStrictEqual(['a', 'b']);
      expect(await find('9F3A')).toStrictEqual(['c']);
      expect(await store.read(LogQuerySchema.parse({ search: 'failed' }))).toMatchObject({
        total: 2,
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'matches a percent sign or an underscore as the character it is',
    async () => {
      const store = createDatabaseLogStore(await aMigratedDatabase());

      await store.save([
        aRecord('a', { message: 'disk 90% full' }),
        aRecord('b', { message: 'disk 90 full' }),
        aRecord('c', { message: 'job_kind unknown' }),
        aRecord('d', { message: 'jobXkind unknown' }),
      ]);

      const find = async (search: string) =>
        (await store.read(LogQuerySchema.parse({ search }))).records.map((one) => one.id);

      expect(await find('90%')).toStrictEqual(['a']);
      expect(await find('job_kind')).toStrictEqual(['c']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'counts each level in each stretch of time, a repeated record as often as it repeated',
    async () => {
      const store = createDatabaseLogStore(await aMigratedDatabase());

      await store.save([
        aRecord('a', { atMs: NOW_MS - 10 * A_MINUTE }),
        aRecord('b', { atMs: NOW_MS - 10 * A_MINUTE, level: 'error' }),
        aRecord('c', { atMs: NOW_MS - A_MINUTE }),
      ]);
      await store.countAgain(['c', 'c']);

      const histogram = await store.histogram(
        LogHistogramQuerySchema.parse({
          sinceMs: NOW_MS - 20 * A_MINUTE,
          untilMs: NOW_MS,
          buckets: 4,
        }),
        NOW_MS,
      );
      const total = (level: 'warn' | 'error') =>
        histogram.buckets.reduce((sum, bucket) => sum + bucket[level], 0);

      expect(histogram.buckets).toHaveLength(4);
      expect(total('warn')).toBe(4);
      expect(total('error')).toBe(1);
      expect(histogram.buckets.at(-1)).toMatchObject({ warn: 3, error: 0 });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'lists the busiest sources and kinds of job, leaving out records with none',
    async () => {
      const store = createDatabaseLogStore(await aMigratedDatabase());

      await store.save([
        aRecord('a', { source: 'scanner', context: { ...NO_CONTEXT, jobKind: 'library.scan' } }),
        aRecord('b', { source: 'scanner', context: { ...NO_CONTEXT, jobKind: 'library.scan' } }),
        aRecord('c', { source: 'transcoder' }),
      ]);

      expect(await store.facets(LogFacetsQuerySchema.parse({}))).toStrictEqual({
        sources: [
          { value: 'scanner', events: 2 },
          { value: 'transcoder', events: 1 },
        ],
        jobKinds: [{ value: 'library.scan', events: 2 }],
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'forgets what has outlived its keeping, answering how many went',
    async () => {
      const store = createDatabaseLogStore(await aMigratedDatabase());

      await store.save([
        aRecord('a', { forgetAfterMs: NOW_MS - A_MINUTE }),
        aRecord('b', { forgetAfterMs: NOW_MS - A_MINUTE }),
        aRecord('c'),
      ]);

      expect(await store.forgetExpired(NOW_MS)).toBe(2);
      expect(await store.forgetExpired(NOW_MS)).toBe(0);
      expect(
        (await store.read(LogQuerySchema.parse({}))).records.map((one) => one.id),
      ).toStrictEqual(['c']);
    },
    STARTING_POSTGRES_MS,
  );
});

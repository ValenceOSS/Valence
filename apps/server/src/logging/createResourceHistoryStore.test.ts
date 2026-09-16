import { describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { asRecord, buildReadQuery } from './createResourceHistoryStore';

const NOWHERE = 'postgres://nobody@localhost:1/none';

/**
 * Builds the read query without running it, so its SQL can be inspected on a machine with no
 * Postgres — a pool connects at its first query and `.toSQL()` never makes one.
 */
const sqlFor = (range: Parameters<typeof buildReadQuery>[1], nowMs: number): string => {
  const { db } = createDatabase(NOWHERE);

  return buildReadQuery(db, range, nowMs).toSQL().sql;
};

describe('reading a range of resource history', () => {
  it('reads from the resource sample table', () => {
    expect(sqlFor('24h', 1_000_000_000)).toContain('"resource_sample"');
  });

  it('narrows to a day for the shortest range', () => {
    const { params } = (() => {
      const { db } = createDatabase(NOWHERE);

      return buildReadQuery(db, '24h', 1_000_000_000).toSQL();
    })();

    expect(params).toContain(1_000_000_000 - 86_400_000);
  });

  it('narrows to a week for the longest range', () => {
    const { db } = createDatabase(NOWHERE);
    const { params } = buildReadQuery(db, '7d', 1_000_000_000).toSQL();

    expect(params).toContain(1_000_000_000 - 7 * 86_400_000);
  });

  it('orders the oldest sample first, so a chart draws left to right', () => {
    expect(sqlFor('24h', 1_000_000_000)).toContain('order by "resource_sample"."atMs" asc');
  });
});

describe('asRecord', () => {
  it('carries a stored sample over as it was recorded', () => {
    const record = asRecord({
      id: 'sample-1',
      atMs: 1000,
      systemCpuPercent: 12.5,
      loadAverage: 1.2,
      systemMemoryUsedBytes: 2048,
      systemMemoryTotalBytes: 4096,
      cpuCount: 4,
    });

    expect(record).toStrictEqual({
      id: 'sample-1',
      atMs: 1000,
      systemCpuPercent: 12.5,
      loadAverage: 1.2,
      systemMemoryUsedBytes: 2048,
      systemMemoryTotalBytes: 4096,
      cpuCount: 4,
    });
  });
});

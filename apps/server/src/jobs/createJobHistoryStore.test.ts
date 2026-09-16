import { describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { asIssue, asRecord, buildReadQuery } from './createJobHistoryStore';

const NOWHERE = 'postgres://nobody@localhost:1/none';

/**
 * Builds the read query without running it, so its SQL can be inspected on a machine with no
 * Postgres — a pool connects at its first query and `.toSQL()` never makes one.
 */
const sqlFor = (query: Parameters<typeof buildReadQuery>[1]): string => {
  const { db } = createDatabase(NOWHERE);

  return buildReadQuery(db, query).toSQL().sql;
};

const NO_FILTERS = { kind: null, status: null, search: '', sinceMs: null, limit: 200 };

describe('reading a page of job history', () => {
  it('reads from the job run table', () => {
    expect(sqlFor(NO_FILTERS)).toContain('"job_run"');
  });

  it('filters by kind when one is asked for', () => {
    expect(sqlFor({ ...NO_FILTERS, kind: 'library.regeneratePreviews' })).toContain('"kind" =');
  });

  it('filters by status when one is asked for', () => {
    expect(sqlFor({ ...NO_FILTERS, status: 'failed' })).toContain('"status" =');
  });

  it('searches the kind, subject and error message when asked for text', () => {
    const sql = sqlFor({ ...NO_FILTERS, search: 'previews' });

    expect(sql).toContain('ILIKE');
    expect(sql).toContain('"kind"');
    expect(sql).toContain('"subject"');
    expect(sql).toContain('"errorMessage"');
  });

  it('narrows to what started since a given time when asked for one', () => {
    expect(sqlFor({ ...NO_FILTERS, sinceMs: 1000 })).toContain('"createdAt" >=');
  });

  it('filters by nothing at all when nothing is asked for', () => {
    expect(sqlFor(NO_FILTERS)).not.toContain('where');
  });

  it('orders the newest run first', () => {
    expect(sqlFor(NO_FILTERS)).toContain('order by "job_run"."createdAt" desc');
  });

  it('caps how many rows come back', () => {
    expect(sqlFor({ ...NO_FILTERS, limit: 50 })).toContain('limit');
  });
});

describe('asRecord', () => {
  const BASE_ROW = {
    id: 'run-1',
    kind: 'library.regeneratePreviews',
    status: 'running',
    subject: 'library-1',
    startedAt: new Date(1000),
    finishedAt: null,
    progress: null,
    errorMessage: null,
    createdAt: new Date(500),
  };

  it('carries the run over as milliseconds rather than dates', () => {
    const record = asRecord(BASE_ROW);

    expect(record).toMatchObject({ startedAtMs: 1000, createdAtMs: 500, finishedAtMs: null });
  });

  it('reads progress that was stored for the run', () => {
    const record = asRecord({
      ...BASE_ROW,
      progress: { phase: 'previews', processed: 3, total: 10 },
    });

    expect(record.progress).toStrictEqual({ phase: 'previews', processed: 3, total: 10 });
  });

  it('falls back to no progress at all for a shape it does not recognise', () => {
    const record = asRecord({ ...BASE_ROW, progress: { nonsense: true } });

    expect(record.progress).toBeNull();
  });

  it('falls back to queued for a status it does not recognise', () => {
    const record = asRecord({ ...BASE_ROW, status: 'somewhere-in-between' });

    expect(record.status).toBe('queued');
  });
});

describe('asIssue', () => {
  it('reads a per-item issue as it was stored', () => {
    const issue = asIssue({
      id: 'issue-1',
      jobRunId: 'run-1',
      path: '/media/a.mkv',
      reason: 'ffmpeg failed',
      atMs: 1234,
    });

    expect(issue).toStrictEqual({
      id: 'issue-1',
      jobRunId: 'run-1',
      path: '/media/a.mkv',
      reason: 'ffmpeg failed',
      atMs: 1234,
    });
  });
});

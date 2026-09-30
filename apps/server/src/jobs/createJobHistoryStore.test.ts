import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { createDatabase } from '#dialect/createDatabase';
import { jobRun } from '#dialect/Schema';
import {
  asIssue,
  asMilliseconds,
  asRecord,
  buildReadQuery,
  buildInterruptQuery,
  buildStatsQuery,
  createJobHistoryStore,
} from './createJobHistoryStore';

const NOWHERE = 'postgres://nobody@localhost:1/none';

/**
 * Builds the read query without running it, so its SQL can be inspected on a machine with no
 * Postgres — a pool connects at its first query and `.toSQL()` never makes one.
 */
const sqlFor = (query: Parameters<typeof buildReadQuery>[1]): string => {
  const { db } = createDatabase(NOWHERE);

  return buildReadQuery(db, query).toSQL().sql;
};

const NO_FILTERS = {
  kind: null,
  status: null,
  search: '',
  sinceMs: null,
  untilMs: null,
  sort: 'newest',
  offset: 0,
  limit: 200,
  runningFirst: false,
} as const;

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

    expect(sql).toContain('like lower(');
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

  it('puts a run that is still going first where the history asks for it', () => {
    expect(sqlFor({ ...NO_FILTERS, runningFirst: true })).toContain(
      `order by case when "job_run"."status" = 'running' then 0 else 1 end`,
    );
  });

  it('keeps a run that began before the window in view while it is still going', () => {
    const sql = sqlFor({ ...NO_FILTERS, runningFirst: true, sinceMs: 1000 });

    expect(sql).toMatch(/\("job_run"\."createdAt" >= \$\d+ or "job_run"\."status" = \$\d+\)/);
  });

  it('orders exactly as asked where the history has not asked for running runs first', () => {
    expect(sqlFor(NO_FILTERS)).not.toContain("= 'running' then 0");
    expect(sqlFor({ ...NO_FILTERS, sinceMs: 1000 })).not.toContain('or "job_run"."status"');
  });

  it('caps how many rows come back, and skips the pages before the one asked for', () => {
    const sql = sqlFor({ ...NO_FILTERS, limit: 50, offset: 100 });

    expect(sql).toContain('limit');
    expect(sql).toContain('offset');
  });

  it('puts the oldest run first when asked', () => {
    expect(sqlFor({ ...NO_FILTERS, sort: 'oldest' })).toContain(
      'order by "job_run"."createdAt" asc',
    );
  });

  it('puts the run that took longest first when asked, unfinished runs last', () => {
    const sql = sqlFor({ ...NO_FILTERS, sort: 'longest' });

    expect(sql).toContain('"finishedAt" - "job_run"."startedAt"');
    expect(sql).toMatch(/is null\), .* desc/);
  });

  it('narrows to what was created before a given time when asked for one', () => {
    expect(sqlFor({ ...NO_FILTERS, untilMs: 5000 })).toContain('"createdAt" <=');
  });

  it('finds a run by the id it was given, as well as by what it did', () => {
    expect(sqlFor({ ...NO_FILTERS, search: 'abc' })).toContain('lower("job_run"."id") like');
  });

  it('groups the alternatives of a search, so they cannot widen the filters beside them', () => {
    const sql = sqlFor({ ...NO_FILTERS, status: 'failed', search: 'abc' });

    expect(sql).toMatch(/"status" = \$\d+ and \(/);
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

describe('buildStatsQuery', () => {
  const statsSql = (): string => {
    const { db } = createDatabase(NOWHERE);

    return buildStatsQuery(db, 1000).toSQL().sql;
  };

  it('summarises each kind of job on its own', () => {
    expect(statsSql()).toContain('group by "job_run"."kind"');
  });

  it('counts how the runs ended', () => {
    const sql = statsSql();

    expect(sql).toContain('case when "job_run"."status" = \'completed\' then 1 else 0 end');
    expect(sql).toContain('case when "job_run"."status" = \'failed\' then 1 else 0 end');
  });

  it('measures the slowest run', () => {
    expect(statsSql()).toContain('max(');
  });

  it('counts only runs since the moment given', () => {
    expect(statsSql()).toContain('"createdAt" >=');
  });
});

describe('asMilliseconds', () => {
  it('reads an exact number the database gave as text', () => {
    expect(asMilliseconds('1400.25')).toBe(1400.25);
  });

  it('reads a number as it is', () => {
    expect(asMilliseconds(900)).toBe(900);
  });

  it('has nothing where there was no finished run to measure', () => {
    expect(asMilliseconds(null)).toBeNull();
  });

  it('has nothing for what is not a number', () => {
    expect(asMilliseconds('soon')).toBeNull();
  });
});

describe('buildInterruptQuery', () => {
  const queryFor = (reason: string) => {
    const { db } = createDatabase(NOWHERE);

    return buildInterruptQuery(db, reason).toSQL();
  };

  it('stops every run still marked as running or waiting, and no other', () => {
    const { sql: text } = queryFor('why');

    expect(text).toContain('update "job_run" set "status" = $1');
    expect(text).toContain("\"status\" in ('running', 'queued')");
  });

  it('marks them stopped rather than failed, saying why', () => {
    expect(queryFor('The server restarted').params).toContain('stopped');
    expect(queryFor('The server restarted').params).toContain('The server restarted');
  });

  it('asks for nothing back, which not every database can give', () => {
    expect(queryFor('why').sql).not.toContain('returning');
  });
});

describe('createJobHistoryStore', () => {
  const STARTING_POSTGRES_MS = 60_000;

  const aRun = (id: string, kind: string, tookMs: number | null) => ({
    id,
    kind,
    status: tookMs === null ? 'running' : 'completed',
    startedAt: new Date(10_000),
    finishedAt: tookMs === null ? null : new Date(10_000 + tookMs),
    createdAt: new Date(10_000),
  });

  it(
    'marks a run started twice as running once, as it was when it was delivered again',
    async () => {
      const db = await aMigratedDatabase();
      const store = createJobHistoryStore(db);

      await store.recordStarted({ id: 'run-1', kind: 'library.scan', subject: null });
      await store.recordFinished({ id: 'run-1', status: 'failed', errorMessage: 'gone' });
      await store.recordStarted({ id: 'run-1', kind: 'library.scan', subject: 'lib' });

      const rows = await db.select().from(jobRun).where(eq(jobRun.id, 'run-1'));

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ status: 'running', subject: 'lib', errorMessage: null });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says how many runs it stopped when the server started',
    async () => {
      const db = await aMigratedDatabase();
      const store = createJobHistoryStore(db);

      await db
        .insert(jobRun)
        .values([aRun('a', 'library.scan', null), aRun('b', 'library.scan', 100)]);

      expect(await store.interruptRunning('restarted')).toBe(1);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'finds the typical run of each kind, halfway between the middle two',
    async () => {
      const db = await aMigratedDatabase();
      const store = createJobHistoryStore(db);

      await db
        .insert(jobRun)
        .values([
          aRun('a', 'library.scan', 100),
          aRun('b', 'library.scan', 300),
          aRun('c', 'library.scan', 900),
          aRun('d', 'library.scan', 200),
          aRun('e', 'server.checkDiskSpace', 50),
          aRun('f', 'server.checkDiskSpace', null),
        ]);

      const stats = await store.readStats(0);

      expect(stats.find((one) => one.kind === 'library.scan')).toMatchObject({
        runs: 4,
        completed: 4,
        medianMs: 250,
        slowestMs: 900,
      });
      expect(stats.find((one) => one.kind === 'server.checkDiskSpace')).toMatchObject({
        runs: 2,
        running: 1,
        medianMs: 50,
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'searches for the text it was given literally, whatever its case',
    async () => {
      const db = await aMigratedDatabase();
      const store = createJobHistoryStore(db);

      await db
        .insert(jobRun)
        .values([aRun('a', 'library.scan', 100), aRun('b', 'server.check_100%', 100)]);

      const read = await store.read({
        kind: null,
        status: null,
        search: 'CHECK_100%',
        sinceMs: null,
        untilMs: null,
        sort: 'newest',
        offset: 0,
        limit: 10,
        runningFirst: false,
      });

      expect(read.records.map((one) => one.id)).toEqual(['b']);
      expect(read.total).toBe(1);
    },
    STARTING_POSTGRES_MS,
  );
});

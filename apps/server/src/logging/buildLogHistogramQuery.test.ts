import { describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { buildLogHistogramQuery } from './buildLogHistogramQuery';
import type { LogFilters } from './logFilterFor';

const NOWHERE = 'postgres://nobody@localhost:1/none';

const NONE: LogFilters = {
  levels: [],
  sources: [],
  search: '',
  sinceMs: null,
  untilMs: null,
  jobId: null,
  jobKinds: [],
  libraryId: null,
  mediaId: null,
  sessionId: null,
  requestId: null,
};

const queryFor = (filters: Partial<LogFilters>) => {
  const { db } = createDatabase(NOWHERE);

  return buildLogHistogramQuery(db, { ...NONE, ...filters }, 60_000).toSQL();
};

describe('buildLogHistogramQuery', () => {
  it('counts events, so a record that repeated counts as often as it did', () => {
    expect(queryFor({}).sql).toContain('sum("count")');
  });

  it('groups them by stretch of time and by level', () => {
    const { sql } = queryFor({});

    expect(sql).toContain('group by');
    expect(sql).toContain('extract(epoch from "log_record"."at")');
    expect(sql).toContain('"log_record"."level"');
  });

  it('divides time by the width of a bar, the same way wherever it is written', () => {
    const { sql, params } = queryFor({});

    expect(sql.split('/ 60000)')).toHaveLength(3);
    expect(params).not.toContain(60_000);
  });

  it('counts only what the filters let through', () => {
    expect(queryFor({ jobId: 'abc' }).sql).toContain('"jobId" =');
  });
});

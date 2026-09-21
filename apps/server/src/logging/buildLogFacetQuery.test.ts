import { describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { logRecord } from '@ValenceServer/db/Schema';
import { buildLogFacetQuery } from './buildLogFacetQuery';
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

const queryFor = (
  filters: Partial<LogFilters>,
  field: typeof logRecord.source | typeof logRecord.jobKind = logRecord.source,
) => {
  const { db } = createDatabase(NOWHERE);

  return buildLogFacetQuery(db, { ...NONE, ...filters }, field).toSQL();
};

describe('buildLogFacetQuery', () => {
  it('ranks the values of a field by how many events carried them', () => {
    const { sql } = queryFor({});

    expect(sql).toContain('group by "log_record"."source"');
    expect(sql).toContain('order by sum("log_record"."count") desc');
  });

  it('leaves out records that have no value for the field', () => {
    expect(queryFor({}, logRecord.jobKind).sql).toContain('"jobKind" is not null');
  });

  it('keeps to the ten most common', () => {
    expect(queryFor({}).params).toContain(10);
  });

  it('counts only what the filters let through', () => {
    expect(queryFor({ levels: ['error'] }).sql).toContain('"level" in');
  });
});

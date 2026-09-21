import { describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { LogQuerySchema } from '@ValenceContracts/schemas/Log';
import { buildLogReadQuery } from './buildLogReadQuery';
import type { LogQuery } from '@ValenceContracts/schemas/Log';

const NOWHERE = 'postgres://nobody@localhost:1/none';

const sqlFor = (query: Partial<LogQuery>) => {
  const { db } = createDatabase(NOWHERE);

  return buildLogReadQuery(db, LogQuerySchema.parse({ levels: [], ...query })).toSQL();
};

describe('buildLogReadQuery', () => {
  it('reads from the log record table', () => {
    expect(sqlFor({}).sql).toContain('"log_record"');
  });

  it('puts the newest record first unless asked for something else', () => {
    expect(sqlFor({}).sql).toContain('order by "log_record"."at" desc');
  });

  it('puts the oldest record first when a trace is read from its start', () => {
    expect(sqlFor({ sort: 'oldest' }).sql).toContain('order by "log_record"."at" asc');
  });

  it('puts the most serious record first when asked, the newest of them leading', () => {
    const { sql } = sqlFor({ sort: 'severest' });

    expect(sql).toContain("when 'error' then 3");
    expect(sql).toContain('desc, "log_record"."at" desc');
  });

  it('puts the record seen most often first when asked', () => {
    expect(sqlFor({ sort: 'busiest' }).sql).toContain('order by "log_record"."count" desc');
  });

  it('breaks ties on the id so that a page is the same page when it is read again', () => {
    expect(sqlFor({ sort: 'oldest' }).sql).toContain('"log_record"."id" asc');
  });

  it('caps a page and skips the pages before it', () => {
    const { sql, params } = sqlFor({ limit: 50, offset: 100 });

    expect(sql).toContain('limit');
    expect(sql).toContain('offset');
    expect(params).toEqual([50, 100]);
  });

  it('filters by an identifier when one is given', () => {
    expect(sqlFor({ requestId: 'r1' }).sql).toContain('"requestId" =');
  });
});

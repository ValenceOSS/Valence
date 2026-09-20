import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { logSearchFilter } from './logSearchFilter';

const dialect = new PgDialect();

describe('logSearchFilter', () => {
  it('has nothing to look for where nothing was typed', () => {
    expect(logSearchFilter('')).toBeUndefined();
    expect(logSearchFilter('   ')).toBeUndefined();
  });

  it('looks in the words of a record and in every identifier it carries', () => {
    const filter = logSearchFilter('abc');

    expect(filter).toBeDefined();

    const { sql } = dialect.sqlToQuery(filter!);

    for (const column of [
      'message',
      'detail',
      'source',
      'jobKind',
      'id',
      'jobId',
      'libraryId',
      'mediaId',
      'sessionId',
      'requestId',
    ]) {
      expect(sql).toContain(`"${column}" ilike`);
    }
  });

  it('groups the alternatives so they cannot widen the filters they are joined to', () => {
    const { sql } = dialect.sqlToQuery(logSearchFilter('abc')!);

    expect(sql.startsWith('(')).toBe(true);
    expect(sql.endsWith(')')).toBe(true);
  });

  it('matches a fragment anywhere in the text, ignoring the padding around it', () => {
    const { params } = dialect.sqlToQuery(logSearchFilter('  9f3a  ')!);

    expect(new Set(params)).toEqual(new Set(['%9f3a%']));
  });

  it('treats characters that mean something to a pattern as the plain characters they are', () => {
    const { params } = dialect.sqlToQuery(logSearchFilter('50%_off')!);

    expect(new Set(params)).toEqual(new Set(['%50\\%\\_off%']));
  });
});

import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { logFilterFor } from './logFilterFor';
import type { LogFilters } from './logFilterFor';

const dialect = new PgDialect();

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

const sqlFor = (filters: Partial<LogFilters>) => {
  const condition = logFilterFor({ ...NONE, ...filters });

  return condition === undefined ? null : dialect.sqlToQuery(condition);
};

describe('logFilterFor', () => {
  it('filters by nothing when nothing is asked for', () => {
    expect(logFilterFor(NONE)).toBeUndefined();
  });

  it('filters by the levels and the sources that were chosen', () => {
    const asked = sqlFor({ levels: ['warn', 'error'], sources: ['jobs'] });

    expect(asked?.sql).toContain('"level" in');
    expect(asked?.sql).toContain('"source" in');
    expect(asked?.params).toEqual(['warn', 'error', 'jobs']);
  });

  it('filters by the kinds of job that were chosen', () => {
    const asked = sqlFor({ jobKinds: ['library.scan'] });

    expect(asked?.sql).toContain('"jobKind" in');
  });

  it('narrows to a time range, both ends included', () => {
    const asked = sqlFor({ sinceMs: 1000, untilMs: 2000 });

    expect(asked?.sql).toContain('"at" >=');
    expect(asked?.sql).toContain('"at" <=');
  });

  it.each([
    ['jobId', '"jobId" ='],
    ['libraryId', '"libraryId" ='],
    ['mediaId', '"mediaId" ='],
    ['sessionId', '"sessionId" ='],
    ['requestId', '"requestId" ='],
  ] as const)('matches %s exactly, not as a fragment', (field, fragment) => {
    const asked = sqlFor({ [field]: 'abc' });

    expect(asked?.sql).toContain(fragment);
    expect(asked?.params).toEqual(['abc']);
  });

  it('searches the words and identifiers of a record when text is typed', () => {
    expect(sqlFor({ search: 'unreadable' })?.sql).toContain('ilike');
  });

  it('joins everything as one condition, so each filter narrows the rest', () => {
    const asked = sqlFor({ levels: ['error'], jobId: 'abc', search: 'x' });

    expect(asked?.sql.split(' and ').length).toBeGreaterThanOrEqual(3);
  });
});

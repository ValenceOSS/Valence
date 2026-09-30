import { getTableConfig, mysqlTable } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';
import { moment } from './moment';

describe('moment', () => {
  it('keeps a moment to the millisecond, as a date, with no 2038 limit', () => {
    const [column] = getTableConfig(mysqlTable('t', { at: moment('at') })).columns;

    expect(column?.getSQLType()).toBe('datetime(3)');
    expect(column?.mapFromDriverValue('2026-09-30 12:00:00.123')).toEqual(
      new Date('2026-09-30T12:00:00.123Z'),
    );
  });
});

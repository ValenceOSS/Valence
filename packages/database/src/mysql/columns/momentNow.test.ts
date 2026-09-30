import { getTableConfig, mysqlTable } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';
import { momentNow } from './momentNow';

describe('momentNow', () => {
  it('starts at the moment the row is written, to the millisecond', () => {
    const [column] = getTableConfig(mysqlTable('t', { at: momentNow('at') })).columns;

    expect(column?.getSQLType()).toBe('datetime(3)');
    expect(column?.hasDefault).toBe(true);
  });
});

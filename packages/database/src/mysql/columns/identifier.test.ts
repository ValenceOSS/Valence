import { getTableConfig, mysqlTable } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';
import { identifier } from './identifier';

describe('identifier', () => {
  it('holds an id in 64 characters, room for a UUID or a plugin id and short enough for any key', () => {
    const [column] = getTableConfig(mysqlTable('t', { id: identifier('id') })).columns;

    expect(column?.getSQLType()).toBe('varchar(64)');
  });
});

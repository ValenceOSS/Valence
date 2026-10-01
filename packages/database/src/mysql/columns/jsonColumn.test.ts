import { getTableConfig, mysqlTable } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';
import { jsonColumn } from './jsonColumn';

const [column] = getTableConfig(mysqlTable('t', { tags: jsonColumn('tags') })).columns;

describe('jsonColumn', () => {
  it('is a JSON column in the database', () => {
    expect(column?.getSQLType()).toBe('json');
  });

  it('writes a value as JSON text and reads the text the engine hands back as the value', () => {
    const value = { names: ['a', 'b'], count: 2 };
    const written = column?.mapToDriverValue(value);

    expect(written).toBe('{"names":["a","b"],"count":2}');
    expect(column?.mapFromDriverValue(written)).toEqual(value);
  });

  it('refuses text that is not JSON rather than handing it on', () => {
    expect(() => column?.mapFromDriverValue('not json')).toThrow();
  });
});

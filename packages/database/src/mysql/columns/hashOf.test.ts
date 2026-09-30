import { SQL } from 'drizzle-orm';
import { MySqlDialect, getTableConfig, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';
import { hashOf } from './hashOf';

describe('hashOf', () => {
  it('stores the SHA-256 of the column it names, so a key can hold text too long to index', () => {
    const table = mysqlTable('t', {
      path: varchar('path', { length: 4096 }),
      pathHash: hashOf('pathHash', 'path'),
    });
    const column = getTableConfig(table).columns.find((one) => one.name === 'pathHash');
    const generated = column?.generated;

    expect(column?.getSQLType()).toBe('binary(32)');
    expect(generated?.mode).toBe('stored');
    expect(
      generated?.as instanceof SQL ? new MySqlDialect().sqlToQuery(generated.as).sql : '',
    ).toBe('unhex(sha2(`path`, 256))');
  });
});

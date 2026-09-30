import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';
import { jsonDefault } from './jsonDefault';

describe('jsonDefault', () => {
  it('writes the default as a bracketed expression, which both engines take for a JSON column', () => {
    expect(new MySqlDialect().sqlToQuery(jsonDefault([])).sql).toBe("('[]')");
  });

  it('doubles a quote inside the value, so the literal cannot end early', () => {
    expect(new MySqlDialect().sqlToQuery(jsonDefault({ name: "it's" })).sql).toBe(
      `('{"name":"it''s"}')`,
    );
  });
});

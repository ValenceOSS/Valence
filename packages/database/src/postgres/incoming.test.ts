import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { incoming } from './incoming';

describe('incoming', () => {
  it('names the value an upsert was about to write', () => {
    expect(new PgDialect().sqlToQuery(incoming(PLAYGROUND.count)).sql).toBe('excluded."count"');
  });
});

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';

describe('PLAYGROUND', () => {
  it('keeps one row to a name', () => {
    const config = getTableConfig(PLAYGROUND);

    expect(config.name).toBe('playground');
    expect(config.indexes.map((index) => index.config.name)).toEqual(['playground_name_idx']);
  });
});

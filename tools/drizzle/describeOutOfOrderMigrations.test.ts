import { describe, expect, it } from 'vitest';
import { describeOutOfOrderMigrations } from './describeOutOfOrderMigrations';

describe('describeOutOfOrderMigrations', () => {
  it('says nothing where nothing was out of order', () => {
    expect(describeOutOfOrderMigrations('server', [])).toBeNull();
  });

  it('names each migration, the app it belongs to and what to change', () => {
    const said = describeOutOfOrderMigrations('server', ['0071_grant_requests']);

    expect(said).toContain('server:');
    expect(said).toContain('0071_grant_requests');
    expect(said).toContain('apps/server/drizzle/meta/_journal.json');
  });

  it('warns against restamping one a database has already run', () => {
    expect(describeOutOfOrderMigrations('server', ['0071_a'])).toContain('never change the stamp');
  });
});

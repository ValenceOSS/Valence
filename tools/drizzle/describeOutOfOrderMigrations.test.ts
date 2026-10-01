import { describe, expect, it } from 'vitest';
import { describeOutOfOrderMigrations } from './describeOutOfOrderMigrations';

describe('describeOutOfOrderMigrations', () => {
  it('says nothing where nothing was out of order', () => {
    expect(describeOutOfOrderMigrations('server', 'postgres', [])).toBeNull();
  });

  it('names each migration, the app it belongs to and what to change', () => {
    const said = describeOutOfOrderMigrations('server', 'postgres', ['0071_grant_requests']);

    expect(said).toContain('server/postgres:');
    expect(said).toContain('0071_grant_requests');
    expect(said).toContain('apps/server/drizzle/postgres/meta/_journal.json');
  });

  it('warns against restamping one a database has already run', () => {
    expect(describeOutOfOrderMigrations('server', 'postgres', ['0071_a'])).toContain(
      'never change the stamp',
    );
  });
});

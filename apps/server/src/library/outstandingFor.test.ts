import { afterAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { outstandingFor } from './createMediaStore';

const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';

const { db, pool } = createDatabase('postgres://valence:valence@localhost:5432/valence');

const asked = (kind: string) => outstandingFor(db, LIBRARY_ID, kind).toSQL();

afterAll(async () => {
  await pool.end();
});

describe('what a render job is still owed', () => {
  it('asks only about the library it was given', () => {
    expect(asked('previews').params).toContain(LIBRARY_ID);
  });

  it('leaves out anything already finished with', () => {
    expect(asked('previews').sql).toContain('"media_item_job"."mediaItemId" is null');
  });

  it('leaves out extras, which are nobody scrubbing and nobody previewing', () => {
    expect(asked('previews').sql).toContain('"media_item"."extraKind" is null');
    expect(asked('trickplay').sql).toContain('"media_item"."extraKind" is null');
  });
});

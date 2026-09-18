import { afterAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { mediaItem } from '@ValenceServer/db/Schema';
import { withinTheCeiling } from './withinTheCeiling';

const { db, pool } = createDatabase('postgres://nobody@localhost:1/none');

const ACCOUNT = {
  kind: 'account',
  accountId: 'acc',
  profileId: null,
  isAdministrator: false,
} as const;

afterAll(async () => {
  await pool.end();
});

describe('withinTheCeiling', () => {
  it('asks nothing of an administrator', () => {
    expect(withinTheCeiling(db, { ...ACCOUNT, isAdministrator: true })).toBeUndefined();
  });

  it('asks nothing of the server itself', () => {
    expect(withinTheCeiling(db, { kind: 'server' })).toBeUndefined();
  });

  it('refuses the unrated only where it is not a song, since nothing certificates music', () => {
    const asked = db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(withinTheCeiling(db, ACCOUNT))
      .toSQL().sql;

    expect(asked).toContain('"age_ceiling"."allowsUnrated"');
    expect(asked).toContain('"music_track"."mediaItemId" = "media_item"."id"');
  });
});

import { afterAll, describe, expect, it } from 'vitest';
import { createDatabase } from '#dialect/createDatabase';
import { mediaItem } from '#dialect/Schema';
import { withinTheCeiling } from './withinTheCeiling';
import { aVisibilityPlayground } from '@ValenceServer/visibility/aVisibilityPlayground';

const STARTING_POSTGRES_MS = 60_000;

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

describe('the age ceiling, on a database', () => {
  it(
    'lets a deny win, an allow beat the ceiling, and refuses unrated things unless allowed them',
    async () => {
      const { viewers, itemsKeptBy } = await aVisibilityPlayground();

      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.kid))).toStrictEqual([
        'cartoon',
        'episode-15',
        'locked-film',
        'song',
      ]);
      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.teen))).toStrictEqual([
        'cartoon',
        'episode-15',
        'film-12',
        'film-unrated',
        'locked-film',
        'song',
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'asks nothing of an administrator, a share guest or the server',
    async () => {
      const { viewers, itemsKeptBy } = await aVisibilityPlayground();

      for (const viewer of [viewers.admin, viewers.guest, viewers.server]) {
        expect(await itemsKeptBy((db) => withinTheCeiling(db, viewer))).toHaveLength(7);
      }
    },
    STARTING_POSTGRES_MS,
  );
});

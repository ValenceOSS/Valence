import { afterAll, describe, expect, it } from 'vitest';
import { createDatabase } from '#dialect/createDatabase';
import { NOWHERE } from '#dialect/NOWHERE';
import { sqlAsPostgresQuotes } from '@ValenceServer/testing/sqlAsPostgresQuotes';
import { mediaItem, profileAgeCeiling, viewerProfile } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { withinTheCeiling } from './withinTheCeiling';
import { aVisibilityPlayground } from '@ValenceServer/visibility/aVisibilityPlayground';

const STARTING_POSTGRES_MS = 60_000;

const { db, pool } = createDatabase(NOWHERE);

const ACCOUNT = {
  kind: 'account',
  accountId: 'acc',
  profileId: null,
  isAdministrator: false,
} as const;

/**
 * The visibility playground, with a profile for the teenager and the administrator, and a way to
 * cap any profile in it.
 *
 * @returns The playground, its viewers with their profiles, and what caps a profile.
 */
const aPlaygroundWithProfiles = async () => {
  const playground = await aVisibilityPlayground();
  const reached: AnyValenceDatabase[] = [];

  await playground.librariesKeptBy((db) => {
    reached.push(db);

    return undefined;
  });

  for (const db of reached) {
    await db.insert(viewerProfile).values([
      { id: 'teen-face', userId: 'teen', name: 'Teen', colour: 'red' },
      { id: 'admin-face', userId: 'admin', name: 'Admin', colour: 'red', isOwner: true },
    ]);
  }

  return {
    ...playground,
    viewers: {
      ...playground.viewers,
      teenAsAProfile: { ...playground.viewers.teen, profileId: 'teen-face' },
      adminAsAProfile: { ...playground.viewers.admin, profileId: 'admin-face' },
    },
    cap: async (
      profileId: string,
      libraryId: string,
      maximumAge: number,
      allowsUnrated = false,
    ) => {
      for (const db of reached) {
        await db
          .insert(profileAgeCeiling)
          .values({ profileId, libraryId, maximumAge, allowsUnrated });
      }
    },
  };
};

afterAll(async () => {
  await pool.end();
});

describe('withinTheCeiling', () => {
  it('asks nothing of an administrator', () => {
    expect(withinTheCeiling(db, { ...ACCOUNT, isAdministrator: true })).toBeUndefined();
  });

  it('asks an administrator only about the cap on the profile acting', () => {
    const asked = sqlAsPostgresQuotes(
      db
        .select({ id: mediaItem.id })
        .from(mediaItem)
        .where(withinTheCeiling(db, { ...ACCOUNT, isAdministrator: true, profileId: 'admin-face' }))
        .toSQL().sql,
    );

    expect(asked).toContain('"profile_age_ceiling"');
    expect(asked).not.toContain('"age_ceiling"."maximumAge"');
  });

  it('asks about a profile’s cap beside the account’s', () => {
    const asked = sqlAsPostgresQuotes(
      db
        .select({ id: mediaItem.id })
        .from(mediaItem)
        .where(withinTheCeiling(db, { ...ACCOUNT, profileId: 'kid-face' }))
        .toSQL().sql,
    );

    expect(asked).toContain('"profile_age_ceiling"."libraryId" = "media_item"."libraryId"');
    expect(asked).toContain('"age_ceiling"');
  });

  it('asks nothing of a profile where none is acting', () => {
    const asked = sqlAsPostgresQuotes(
      db.select({ id: mediaItem.id }).from(mediaItem).where(withinTheCeiling(db, ACCOUNT)).toSQL()
        .sql,
    );

    expect(asked).not.toContain('"profile_age_ceiling"');
  });

  it('asks nothing of the server itself', () => {
    expect(withinTheCeiling(db, { kind: 'server' })).toBeUndefined();
  });

  it('refuses the unrated only where it is not a song, since nothing certificates music', () => {
    const asked = sqlAsPostgresQuotes(
      db.select({ id: mediaItem.id }).from(mediaItem).where(withinTheCeiling(db, ACCOUNT)).toSQL()
        .sql,
    );

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

describe('a profile’s age cap, on a database', () => {
  it(
    'caps a profile below what its account may see, unrated things included',
    async () => {
      const { viewers, itemsKeptBy, cap } = await aPlaygroundWithProfiles();

      await cap('teen-face', 'films', 12);

      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.teenAsAProfile))).toStrictEqual(
        ['cartoon', 'film-12', 'locked-film', 'song'],
      );
      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.teen))).toHaveLength(6);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'lets unrated things through a profile’s cap where it allows them',
    async () => {
      const { viewers, itemsKeptBy, cap } = await aPlaygroundWithProfiles();

      await cap('teen-face', 'films', 12, true);

      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.teenAsAProfile))).toContain(
        'film-unrated',
      );
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'never caps a song for being unrated, since nothing certificates music',
    async () => {
      const { viewers, itemsKeptBy, cap } = await aPlaygroundWithProfiles();

      await cap('teen-face', 'music', 0);

      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.teenAsAProfile))).toContain(
        'song',
      );
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'caps an administrator’s own profile too, and not the administrator without it',
    async () => {
      const { viewers, itemsKeptBy, cap } = await aPlaygroundWithProfiles();

      await cap('admin-face', 'films', 12);

      expect(
        await itemsKeptBy((db) => withinTheCeiling(db, viewers.adminAsAProfile)),
      ).toStrictEqual(['cartoon', 'film-12', 'locked-film', 'song']);
      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.admin))).toHaveLength(7);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'never lifts the account’s own cap, nor its exceptions’ refusals',
    async () => {
      const { viewers, itemsKeptBy, cap } = await aPlaygroundWithProfiles();

      await cap('kid-face', 'films', 21, true);
      await cap('kid-face', 'music', 21, true);

      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.kid))).toStrictEqual([
        'cartoon',
        'episode-15',
        'locked-film',
        'song',
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'caps a profile even where its account’s exception would allow it',
    async () => {
      const { viewers, itemsKeptBy, cap } = await aPlaygroundWithProfiles();

      await cap('kid-face', 'films', 12);

      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.kid))).not.toContain(
        'episode-15',
      );
      expect(await itemsKeptBy((db) => withinTheCeiling(db, viewers.kidWithoutProfiles))).toContain(
        'episode-15',
      );
    },
    STARTING_POSTGRES_MS,
  );
});

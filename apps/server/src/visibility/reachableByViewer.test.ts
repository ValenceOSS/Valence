import { describe, expect, it } from 'vitest';
import { profileAgeCeiling, profileLibraryBlock, viewerProfile } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { narrowedForTest } from '@ValenceServer/visibility/narrowedForTest';
import { reachableByViewer } from './reachableByViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { aVisibilityPlayground } from '@ValenceServer/visibility/aVisibilityPlayground';

const STARTING_POSTGRES_MS = 60_000;

const WATCHER: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdministrator: false,
};

/**
 * The visibility playground, with a profile for the teenager and the administrator, and a way to
 * narrow any profile in it.
 *
 * @returns The playground, its viewers with their profiles, and what narrows a profile.
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
    keepOut: async (profileId: string, libraryId: string) => {
      for (const db of reached) {
        await db.insert(profileLibraryBlock).values({ profileId, libraryId });
      }
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

describe('which libraries an account may reach', () => {
  it('asks whether this account was refused this item’s library', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, WATCHER));

    expect(sql).toContain('not exists');
    expect(sql).toContain('"library_block"');
  });

  it('correlates the refusal to the row outside it, rather than to any refusal at all', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, WATCHER));

    expect(sql).toContain('"library_block"."libraryId" = "media_item"."libraryId"');
  });

  it('narrows to this account, so one person’s refusal is not everybody’s', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, WATCHER));

    expect(sql).toContain('"library_block"."userId"');
  });

  it('asks nothing of an administrator, who reaches everything', () => {
    const sql = narrowedForTest((db) =>
      reachableByViewer(db, { ...WATCHER, isAdministrator: true }),
    );

    expect(sql).not.toContain('"library_block"');
  });

  it('asks nothing of a share guest, whose reach was settled when the link was made', () => {
    const sql = narrowedForTest((db) =>
      reachableByViewer(db, { kind: 'guest', shareId: 'share-1' }),
    );

    expect(sql).not.toContain('"library_block"');
  });

  it('asks whether the profile acting was kept from this item’s library', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, WATCHER));

    expect(sql).toContain('"profile_library_block"."profileId"');
    expect(sql).toContain('"profile_library_block"."libraryId" = "media_item"."libraryId"');
  });

  it('asks it of an administrator’s profile too, since the owner may narrow any profile', () => {
    const sql = narrowedForTest((db) =>
      reachableByViewer(db, { ...WATCHER, isAdministrator: true }),
    );

    expect(sql).toContain('"profile_library_block"');
  });

  it('asks nothing of a profile where none is acting', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, { ...WATCHER, profileId: null }));

    expect(sql).not.toContain('"profile_library_block"');
  });

  it('still narrows an account that has no profile, since this half is not the profile’s', () => {
    const sql = narrowedForTest((db) => reachableByViewer(db, { ...WATCHER, profileId: null }));

    expect(sql).toContain('"library_block"');
  });
});

describe('what an account may reach, on a database', () => {
  it(
    'keeps a child out of a library they were kept from and above their ceiling',
    async () => {
      const { viewers, itemsKeptBy } = await aVisibilityPlayground();

      expect(await itemsKeptBy((db) => reachableByViewer(db, viewers.kid))).toStrictEqual([
        'cartoon',
        'episode-15',
        'song',
      ]);
      expect(await itemsKeptBy((db) => reachableByViewer(db, viewers.teen))).toStrictEqual([
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
    'lets an administrator, a share guest and the server reach everything',
    async () => {
      const { viewers, itemsKeptBy } = await aVisibilityPlayground();

      for (const viewer of [
        viewers.admin,
        viewers.adminWatchingAsKid,
        viewers.guest,
        viewers.server,
      ]) {
        expect(await itemsKeptBy((db) => reachableByViewer(db, viewer))).toHaveLength(7);
      }
    },
    STARTING_POSTGRES_MS,
  );
});

describe('what a profile may reach, on a database', () => {
  it(
    'keeps a profile out of a library its owner kept it from',
    async () => {
      const { viewers, itemsKeptBy, keepOut } = await aPlaygroundWithProfiles();

      await keepOut('teen-face', 'kids');

      expect(
        await itemsKeptBy((db) => reachableByViewer(db, viewers.teenAsAProfile)),
      ).toStrictEqual(['episode-15', 'film-12', 'film-unrated', 'locked-film', 'song']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps another profile, and the account without a profile, where they were',
    async () => {
      const { viewers, itemsKeptBy, keepOut } = await aPlaygroundWithProfiles();

      await keepOut('kid-face', 'films');

      expect(await itemsKeptBy((db) => reachableByViewer(db, viewers.teenAsAProfile))).toHaveLength(
        6,
      );
      expect(
        await itemsKeptBy((db) => reachableByViewer(db, viewers.kidWithoutProfiles)),
      ).toStrictEqual(['cartoon', 'episode-15', 'song']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps an administrator’s own profile out of a library too',
    async () => {
      const { viewers, itemsKeptBy, keepOut } = await aPlaygroundWithProfiles();

      await keepOut('admin-face', 'music');

      expect(
        await itemsKeptBy((db) => reachableByViewer(db, viewers.adminAsAProfile)),
      ).not.toContain('song');
      expect(await itemsKeptBy((db) => reachableByViewer(db, viewers.admin))).toHaveLength(7);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'caps a profile below what its account may see',
    async () => {
      const { viewers, itemsKeptBy, cap } = await aPlaygroundWithProfiles();

      await cap('teen-face', 'films', 12);

      expect(
        await itemsKeptBy((db) => reachableByViewer(db, viewers.teenAsAProfile)),
      ).toStrictEqual(['cartoon', 'film-12', 'locked-film', 'song']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'never lets a profile past what its account may reach',
    async () => {
      const { viewers, itemsKeptBy, cap } = await aPlaygroundWithProfiles();

      await cap('kid-face', 'films', 21, true);
      await cap('kid-face', 'locked', 21, true);

      expect(await itemsKeptBy((db) => reachableByViewer(db, viewers.kid))).toStrictEqual([
        'cartoon',
        'episode-15',
        'song',
      ]);
    },
    STARTING_POSTGRES_MS,
  );
});

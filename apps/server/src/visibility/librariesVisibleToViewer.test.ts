import { and, asc } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createDatabase } from '#dialect/createDatabase';
import { NOWHERE } from '#dialect/NOWHERE';
import { sqlAsPostgresQuotes } from '@ValenceServer/testing/sqlAsPostgresQuotes';
import { library, profileLibraryBlock, viewerProfile } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { librariesVisibleToViewer } from './librariesVisibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { aVisibilityPlayground } from '@ValenceServer/visibility/aVisibilityPlayground';

const STARTING_POSTGRES_MS = 60_000;

const WATCHER: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdministrator: false,
};

const asked = (viewer: Viewer): string => {
  const { db } = createDatabase(NOWHERE);

  return sqlAsPostgresQuotes(
    db
      .select({ id: library.id })
      .from(library)
      .where(and(librariesVisibleToViewer(db, viewer)))
      .orderBy(asc(library.name))
      .toSQL().sql,
  );
};

/**
 * The visibility playground, with a profile for the teenager and the administrator, and a way to
 * keep any profile in it out of a library.
 *
 * @returns The playground, its viewers with their profiles, and what keeps a profile out.
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
  };
};

describe('which libraries a viewer is offered', () => {
  it('correlates both halves to the library, not to anything inside it', () => {
    const sql = asked(WATCHER);

    expect(sql).toContain('"library_block"."libraryId" = "library"."id"');
    expect(sql).toContain('"hidden"."libraryId" = "library"."id"');
  });

  it('asks only whether the library itself was hidden, not an item in it', () => {
    expect(asked(WATCHER)).not.toContain('"hidden"."mediaItemId"');
  });

  it('offers an administrator every library except the ones they hid', () => {
    const sql = asked({ ...WATCHER, isAdministrator: true });

    expect(sql).not.toContain('"library_block"');
    expect(sql).toContain('"hidden"');
  });

  it('asks whether the profile acting was kept from the library itself', () => {
    expect(asked(WATCHER)).toContain('"profile_library_block"."libraryId" = "library"."id"');
  });

  it('asks it of an administrator’s profile too', () => {
    expect(asked({ ...WATCHER, isAdministrator: true })).toContain('"profile_library_block"');
  });

  it('narrows an account with no profile by reach alone', () => {
    const sql = asked({ ...WATCHER, profileId: null });

    expect(sql).toContain('"library_block"');
    expect(sql).not.toContain('"hidden"');
    expect(sql).not.toContain('"profile_library_block"');
  });

  it('narrows a share guest in neither way', () => {
    const sql = asked({ kind: 'guest', shareId: 'share-1' });

    expect(sql).not.toContain('"library_block"');
    expect(sql).not.toContain('"hidden"');
  });
});

describe('which libraries a viewer is offered, on a database', () => {
  it(
    'leaves out a library the account is kept from and one the profile hid',
    async () => {
      const { viewers, librariesKeptBy } = await aVisibilityPlayground();
      const kept = (viewer: Viewer) =>
        librariesKeptBy((db) => librariesVisibleToViewer(db, viewer));

      expect(await kept(viewers.kid)).toStrictEqual(['films', 'kids']);
      expect(await kept(viewers.kidWithoutProfiles)).toStrictEqual(['films', 'kids', 'music']);
      expect(await kept(viewers.adminWatchingAsKid)).toStrictEqual(['films', 'kids', 'locked']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'offers every library to an administrator, a share guest and the server',
    async () => {
      const { viewers, librariesKeptBy } = await aVisibilityPlayground();

      for (const viewer of [viewers.admin, viewers.guest, viewers.server]) {
        expect(await librariesKeptBy((db) => librariesVisibleToViewer(db, viewer))).toStrictEqual([
          'films',
          'kids',
          'locked',
          'music',
        ]);
      }
    },
    STARTING_POSTGRES_MS,
  );
});

describe('which libraries a profile is offered, on a database', () => {
  it(
    'leaves out a library the profile was kept from, and only for that profile',
    async () => {
      const { viewers, librariesKeptBy, keepOut } = await aPlaygroundWithProfiles();

      await keepOut('teen-face', 'kids');

      expect(
        await librariesKeptBy((db) => librariesVisibleToViewer(db, viewers.teenAsAProfile)),
      ).toStrictEqual(['films', 'locked', 'music']);
      expect(
        await librariesKeptBy((db) => librariesVisibleToViewer(db, viewers.teen)),
      ).toStrictEqual(['films', 'kids', 'locked', 'music']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'leaves one out for an administrator’s own profile too',
    async () => {
      const { viewers, librariesKeptBy, keepOut } = await aPlaygroundWithProfiles();

      await keepOut('admin-face', 'music');

      expect(
        await librariesKeptBy((db) => librariesVisibleToViewer(db, viewers.adminAsAProfile)),
      ).toStrictEqual(['films', 'kids', 'locked']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'never offers a profile a library its account is kept from',
    async () => {
      const { viewers, librariesKeptBy, keepOut } = await aPlaygroundWithProfiles();

      await keepOut('kid-face', 'films');

      expect(
        await librariesKeptBy((db) => librariesVisibleToViewer(db, viewers.kid)),
      ).toStrictEqual(['kids']);
    },
    STARTING_POSTGRES_MS,
  );
});

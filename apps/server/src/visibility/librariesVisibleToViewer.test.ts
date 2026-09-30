import { and, asc } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createDatabase } from '#dialect/createDatabase';
import { NOWHERE } from '#dialect/NOWHERE';
import { sqlAsPostgresQuotes } from '@ValenceServer/testing/sqlAsPostgresQuotes';
import { library } from '#dialect/Schema';
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

  it('narrows an account with no profile by reach alone', () => {
    const sql = asked({ ...WATCHER, profileId: null });

    expect(sql).toContain('"library_block"');
    expect(sql).not.toContain('"hidden"');
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

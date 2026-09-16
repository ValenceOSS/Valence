import { and, asc } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { library } from '@ValenceServer/db/Schema';
import { librariesVisibleToViewer } from './librariesVisibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const NOWHERE = 'postgres://nobody@localhost:1/none';

const WATCHER: Viewer = {
  kind: 'account',
  accountId: 'account-1',
  profileId: 'profile-1',
  isAdministrator: false,
};

const asked = (viewer: Viewer): string => {
  const { db } = createDatabase(NOWHERE);

  return db
    .select({ id: library.id })
    .from(library)
    .where(and(librariesVisibleToViewer(db, viewer)))
    .orderBy(asc(library.name))
    .toSQL().sql;
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

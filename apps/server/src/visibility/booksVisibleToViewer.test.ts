import { and } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { book } from '@ValenceServer/db/Schema';
import { booksVisibleToViewer } from './booksVisibleToViewer';
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
    .select({ id: book.id })
    .from(book)
    .where(and(booksVisibleToViewer(db, viewer)))
    .toSQL().sql;
};

describe('which books a viewer can see', () => {
  it('keeps a book to the libraries the viewer is offered', () => {
    const sql = asked(WATCHER);

    expect(sql).toContain('"book"."libraryId" in (select "id" from "library"');
    expect(sql).toContain('"library_block"."libraryId" = "library"."id"');
    expect(sql).toContain('"hidden"."libraryId" = "library"."id"');
  });

  it('lets an administrator see the books of any library they have not hidden', () => {
    const sql = asked({ ...WATCHER, isAdministrator: true });

    expect(sql).not.toContain('"library_block"');
    expect(sql).toContain('"hidden"');
  });

  it('holds nothing back from a guest, who is held to what was shared before this', () => {
    expect(asked({ kind: 'guest', shareId: 'share-1' })).not.toContain('where');
  });

  it('holds nothing back from the server itself', () => {
    expect(asked({ kind: 'server' })).not.toContain('where');
  });
});

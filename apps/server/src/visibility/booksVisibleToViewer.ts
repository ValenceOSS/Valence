import { inArray } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { book, library } from '@ValenceServer/db/Schema';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * The condition that keeps a book out of sight of somebody who may not see it.
 *
 * A book has no age rating and cannot be hidden on its own, so what decides whether it can be seen
 * is its library: one the account was refused, or the profile hid, takes its books with it — the
 * same rule that keeps the library itself off the shelf. A guest is held to what was shared with
 * them before a request reaches here, and the server itself sees everything.
 *
 * @param db - The database.
 * @param viewer - Who is looking.
 * @returns The condition to add to a query of books, or nothing where every book is in sight.
 */
const booksVisibleToViewer = (db: ValenceDatabase, viewer: Viewer): SQL | undefined => {
  const visible = librariesVisibleToViewer(db, viewer);

  return visible === undefined
    ? undefined
    : inArray(book.libraryId, db.select({ id: library.id }).from(library).where(visible));
};

export { booksVisibleToViewer };

import { and, eq, notExists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { hidden, library, libraryBlock } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { fromLinkedServersOnly } from '@ValenceServer/visibility/fromLinkedServersOnly';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Which libraries a viewer should be offered at all.
 *
 * The same two halves as the condition over items, asked of the library itself rather than of things
 * inside it, because the row being narrowed here is a library and a condition correlated to
 * `media_item` would match nothing.
 *
 * Both halves matter for a library and they mean different things. One is an administrator saying an
 * account may not reach it, and the account cannot undo that. The other is the person watching
 * saying they never want to see it, which is the cheapest hiding there is — somebody who does not
 * watch television hides one thing and their home page becomes theirs.
 *
 * A library kept from a server this one is no longer linked with is offered to nobody, until the two
 * link again; the server itself, which keeps it, still reads it.
 *
 * @param db - The database the subqueries are built against.
 * @param viewer - Who is asking.
 * @returns The condition, or nothing where this viewer is offered everything.
 */
const librariesVisibleToViewer = (db: AnyValenceDatabase, viewer: Viewer): SQL | undefined => {
  if (viewer.kind === 'server') {
    return undefined;
  }

  if (viewer.kind !== 'account') {
    return fromLinkedServersOnly(db, 'library');
  }

  const { accountId, profileId, isAdministrator } = viewer;

  const reachable = isAdministrator
    ? undefined
    : notExists(
        db
          .select({ one: sql`1` })
          .from(libraryBlock)
          .where(and(eq(libraryBlock.userId, accountId), eq(libraryBlock.libraryId, library.id))),
      );

  const unhidden =
    profileId === null
      ? undefined
      : notExists(
          db
            .select({ one: sql`1` })
            .from(hidden)
            .where(and(eq(hidden.profileId, profileId), eq(hidden.libraryId, library.id))),
        );

  return and(fromLinkedServersOnly(db, 'library'), reachable, unhidden);
};

export { librariesVisibleToViewer };

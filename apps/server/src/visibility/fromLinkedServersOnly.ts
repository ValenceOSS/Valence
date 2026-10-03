import { and, eq, ne, notExists, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { library, linkedServer, mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * Leaves out what comes from a server this one is no longer linked with — unlinked by either side,
 * or refused. Its libraries and titles are kept rather than deleted, so what people here watched,
 * rated and kept of them comes back if the two link again; until then nobody is shown them.
 *
 * @param db - The database the subquery is built against.
 * @param of - Whether the rows being narrowed are libraries or titles.
 * @returns The condition.
 */
const fromLinkedServersOnly = (db: AnyValenceDatabase, of: 'library' | 'item'): SQL =>
  of === 'library'
    ? notExists(
        db
          .select({ one: sql`1` })
          .from(linkedServer)
          .where(
            and(eq(linkedServer.id, library.linkedServerId), ne(linkedServer.state, 'linked')),
          ),
      )
    : notExists(
        db
          .select({ one: sql`1` })
          .from(library)
          .innerJoin(linkedServer, eq(linkedServer.id, library.linkedServerId))
          .where(and(eq(library.id, mediaItem.libraryId), ne(linkedServer.state, 'linked'))),
      );

export { fromLinkedServersOnly };

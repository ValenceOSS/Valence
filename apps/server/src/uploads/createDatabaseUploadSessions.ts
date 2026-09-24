import { and, eq, lt, sql } from 'drizzle-orm';
import { UPLOAD_PIECE_BYTES } from '@ValenceContracts/schemas/UploadPieces';
import { uploadSession } from '@ValenceServer/db/Schema';
import { beginUploadSession } from '@ValenceServer/uploads/beginUploadSession';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { ValenceSchema } from '@ValenceServer/db/Database';
import type { UploadSession, UploadSessions } from '@ValenceServer/uploads/UploadSession';

const LEFT_FOR = 6 * 60 * 60 * 1000;

/**
 * Reads a stored upload back as the routes use it.
 *
 * @param row - The row.
 * @returns The upload.
 */
const sessionOf = (row: typeof uploadSession.$inferSelect): UploadSession => ({
  uploadId: row.id,
  libraryId: row.libraryId,
  path: row.path,
  destination: row.destination,
  staging: row.staging,
  bytes: row.bytes,
  pieceBytes: row.pieceBytes,
  pieces: row.pieces,
  received: [...row.received].sort((one, other) => one - other),
  touchedAt: row.touchedAt.getTime(),
});

/**
 * The uploads coming in piece by piece, kept in the database so that a server restarting part of
 * the way through one forgets nothing: the same file chosen again asks which pieces arrived and
 * sends only the rest. Each is kept until it is finished, cancelled, or left alone long enough to
 * count as abandoned, when whoever sweeps throws its staging file away.
 *
 * A piece arriving is recorded in one statement that adds its number to those already there, so
 * two pieces landing at once can never lose one another; a piece sent again that arrived short
 * comes off the list the same way, since what it overwrote is no longer whole.
 *
 * @param db - The database.
 * @param leftFor - How long an upload may go untouched before it counts as abandoned.
 * @param pieceBytes - How large each piece is, but the last.
 * @returns The uploads.
 */
const createDatabaseUploadSessions = (
  db: PgDatabase<PgQueryResultHKT, ValenceSchema>,
  leftFor = LEFT_FOR,
  pieceBytes = UPLOAD_PIECE_BYTES,
): UploadSessions => ({
  open: async (upload) => {
    const session = beginUploadSession(upload, pieceBytes, Date.now());

    await db.insert(uploadSession).values({
      id: session.uploadId,
      libraryId: session.libraryId,
      path: session.path,
      destination: session.destination,
      staging: session.staging,
      bytes: session.bytes,
      pieceBytes: session.pieceBytes,
      pieces: session.pieces,
      touchedAt: new Date(session.touchedAt),
    });

    return session;
  },

  find: async (uploadId, libraryId) => {
    const [row] = await db
      .update(uploadSession)
      .set({ touchedAt: new Date() })
      .where(and(eq(uploadSession.id, uploadId), eq(uploadSession.libraryId, libraryId)))
      .returning();

    return row === undefined ? null : sessionOf(row);
  },

  receive: async (uploadId, index, isWhole) => {
    const [row] = await db
      .update(uploadSession)
      .set({
        received: isWhole
          ? sql`(select coalesce(array_agg(distinct piece order by piece), '{}') from unnest(array_append(${uploadSession.received}, ${index}::integer)) as piece)`
          : sql`array_remove(${uploadSession.received}, ${index}::integer)`,
        touchedAt: new Date(),
      })
      .where(eq(uploadSession.id, uploadId))
      .returning({ received: uploadSession.received });

    return row === undefined ? [] : [...row.received].sort((one, other) => one - other);
  },

  close: async (uploadId) => {
    await db.delete(uploadSession).where(eq(uploadSession.id, uploadId));
  },

  stale: async () => {
    const left = await db
      .delete(uploadSession)
      .where(lt(uploadSession.touchedAt, new Date(Date.now() - leftFor)))
      .returning();

    return left.map(sessionOf);
  },
});

export { createDatabaseUploadSessions };

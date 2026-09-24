import { UPLOAD_PIECE_BYTES } from '@ValenceContracts/schemas/UploadPieces';
import { beginUploadSession } from '@ValenceServer/uploads/beginUploadSession';
import type { UploadSession, UploadSessions } from '@ValenceServer/uploads/UploadSession';

const LEFT_FOR = 6 * 60 * 60 * 1000;

/**
 * The uploads coming in piece by piece, held in memory — for tests, and anywhere there is no
 * database. Each is kept until it is finished, cancelled or left alone long enough to count as
 * abandoned. The server's own keeps them in the database instead, so that a restart part of the way
 * through forgets nothing; see `createDatabaseUploadSessions`.
 *
 * @param now - The time, in milliseconds, for telling how long an upload has been left.
 * @param leftFor - How long an upload may go untouched before it counts as abandoned.
 * @param pieceBytes - How large each piece is, but the last.
 * @returns The uploads.
 */
const createUploadSessions = (
  now = Date.now,
  leftFor = LEFT_FOR,
  pieceBytes = UPLOAD_PIECE_BYTES,
): UploadSessions => {
  const open = new Map<string, UploadSession>();

  return {
    open: (upload) => {
      const session = beginUploadSession(upload, pieceBytes, now());

      open.set(session.uploadId, session);

      return Promise.resolve(session);
    },

    find: (uploadId, libraryId) => {
      const session = open.get(uploadId);

      if (session === undefined || session.libraryId !== libraryId) {
        return Promise.resolve(null);
      }

      const touched = { ...session, touchedAt: now() };

      open.set(uploadId, touched);

      return Promise.resolve(touched);
    },

    receive: (uploadId, index, isWhole) => {
      const session = open.get(uploadId);

      if (session === undefined) {
        return Promise.resolve([]);
      }

      const others = session.received.filter((one) => one !== index);
      const received = (isWhole ? [...others, index] : others).sort((one, other) => one - other);

      open.set(uploadId, { ...session, received, touchedAt: now() });

      return Promise.resolve(received);
    },

    close: (uploadId) => {
      open.delete(uploadId);

      return Promise.resolve();
    },

    stale: () => {
      const cutOff = now() - leftFor;
      const left = [...open.values()].filter((session) => session.touchedAt < cutOff);

      left.forEach((session) => open.delete(session.uploadId));

      return Promise.resolve(left);
    },
  };
};

export { createUploadSessions };

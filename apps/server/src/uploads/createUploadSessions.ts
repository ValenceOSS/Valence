import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import { UPLOAD_PIECE_BYTES } from '@ValenceContracts/schemas/UploadPieces';
import type { UploadSession, UploadSessions } from '@ValenceServer/uploads/UploadSession';

const LEFT_FOR = 6 * 60 * 60 * 1000;

/**
 * The uploads coming in piece by piece, each kept until it is finished, cancelled or left alone for
 * long enough to count as abandoned.
 *
 * They are held in memory, since a piece is only ever a few seconds from the last. A server that
 * restarts mid-upload forgets it, so the upload is begun again; the staging file left behind is
 * hidden, so a scan never takes it for media.
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
    open: ({ libraryId, path, destination, bytes }) => {
      const uploadId = randomUUID();
      const session: UploadSession = {
        uploadId,
        libraryId,
        path,
        destination,
        staging: join(dirname(destination), `.${basename(destination)}.${uploadId}.part`),
        bytes,
        pieceBytes,
        pieces: Math.max(Math.ceil(bytes / pieceBytes), 1),
        received: new Set(),
        touchedAt: now(),
      };

      open.set(uploadId, session);

      return session;
    },

    find: (uploadId, libraryId) => {
      const session = open.get(uploadId);

      if (session === undefined || session.libraryId !== libraryId) {
        return null;
      }

      session.touchedAt = now();

      return session;
    },

    close: (uploadId) => {
      open.delete(uploadId);
    },

    stale: () => {
      const cutOff = now() - leftFor;
      const left = [...open.values()].filter((session) => session.touchedAt < cutOff);

      left.forEach((session) => open.delete(session.uploadId));

      return left;
    },
  };
};

export { createUploadSessions };

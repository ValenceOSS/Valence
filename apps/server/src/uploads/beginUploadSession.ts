import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import type { UploadSession } from '@ValenceServer/uploads/UploadSession';

/**
 * A new upload's record, before anything has arrived: its id, the hidden staging file beside where
 * it is going, and how many pieces of the given size it comes in — one at least, for an empty file.
 *
 * @param upload - What is being uploaded, and where.
 * @param pieceBytes - How large each piece is, but the last.
 * @param now - The time, in milliseconds.
 * @returns The record.
 */
const beginUploadSession = (
  upload: { libraryId: string; path: string; destination: string; bytes: number },
  pieceBytes: number,
  now: number,
): UploadSession => {
  const uploadId = randomUUID();

  return {
    uploadId,
    ...upload,
    staging: join(dirname(upload.destination), `.${basename(upload.destination)}.${uploadId}.part`),
    pieceBytes,
    pieces: Math.max(Math.ceil(upload.bytes / pieceBytes), 1),
    received: [],
    touchedAt: now,
  };
};

export { beginUploadSession };

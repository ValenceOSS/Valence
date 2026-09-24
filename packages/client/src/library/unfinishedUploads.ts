import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

const STORAGE_KEY = 'valence.unfinishedUploads';

const UnfinishedUploadSchema = z.object({
  key: z.string(),
  libraryId: z.string(),
  path: z.string(),
  bytes: z.number().int().nonnegative(),
  uploadId: z.string(),
  pieceBytes: z.number().int().positive(),
  startedAt: z.string(),
});

type UnfinishedUpload = z.infer<typeof UnfinishedUploadSchema>;

/**
 * What tells one file apart from another for carrying an upload on: the library and path it is
 * going to, and the file's own size and when it last changed — so the same film chosen again after
 * the page closed is recognised, and an edited one is not taken for it.
 *
 * @param libraryId - The library it is going to.
 * @param path - Where in the library.
 * @param file - The file.
 * @returns The key.
 */
const keyOfUpload = (libraryId: string, path: string, file: File): string =>
  [libraryId, path, file.size.toString(), file.lastModified.toString()].join('\n');

/**
 * Reads every upload on this device that was begun and never finished.
 *
 * @returns Them, oldest first.
 */
const readEvery = (): UnfinishedUpload[] => {
  const held = platformInUse().store.read(STORAGE_KEY);
  const read = z.array(UnfinishedUploadSchema).safeParse(held === null ? null : JSON.parse(held));

  return read.success ? read.data : [];
};

/**
 * The uploads on this device that were begun and never finished — the page closed, the connection
 * went, the run was stopped — so the same files chosen again carry on from the pieces the server
 * already has. Kept on the device, since the file itself only ever is.
 *
 * @param libraryId - Only those going into this library, where one is named.
 * @returns Them, oldest first.
 */
const readUnfinishedUploads = (libraryId?: string): UnfinishedUpload[] =>
  readEvery().filter((one) => libraryId === undefined || one.libraryId === libraryId);

/**
 * Remembers an upload that has begun, replacing whatever was remembered for the same file.
 *
 * @param upload - The upload.
 */
const rememberUnfinishedUpload = (upload: UnfinishedUpload): void => {
  platformInUse().store.write(
    STORAGE_KEY,
    JSON.stringify([...readEvery().filter((one) => one.key !== upload.key), upload]),
  );
};

/**
 * Forgets an upload, once it is finished or given up on.
 *
 * @param key - Which, by `keyOfUpload`.
 */
const forgetUnfinishedUpload = (key: string): void => {
  const left = readEvery().filter((one) => one.key !== key);

  if (left.length === 0) {
    platformInUse().store.forget(STORAGE_KEY);
  } else {
    platformInUse().store.write(STORAGE_KEY, JSON.stringify(left));
  }
};

export type { UnfinishedUpload };

export { forgetUnfinishedUpload, keyOfUpload, readUnfinishedUploads, rememberUnfinishedUpload };

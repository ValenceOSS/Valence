import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { access, mkdir, rename, rm, stat, truncate, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { UploadDisk, UploadRefusal, UploadResult } from '@ValenceServer/uploads/UploadDisk';

/**
 * Reads the code a filesystem error carries, such as `EROFS`, where it carries one.
 *
 * @param error - What the filesystem threw.
 * @returns The code, or nothing.
 */
const codeOf = (error: Error): string | null =>
  'code' in error && typeof error.code === 'string' ? error.code : null;

/**
 * Whether something is already at a path.
 *
 * @param path - What to look for.
 * @returns Whether anything is there.
 */
const isThere = async (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

/**
 * What the disk's refusal was, told apart so the fix for a read-only mount or a folder Valence may
 * not write can be named.
 *
 * @param error - What the filesystem threw.
 * @returns The refusal.
 */
const refusalOf = (error: Error | null): UploadRefusal => {
  const code = error === null ? null : codeOf(error);

  if (code === 'EROFS') {
    return { kind: 'readOnly' };
  }

  return code === 'EACCES' || code === 'EPERM' ? { kind: 'denied' } : { kind: 'failed' };
};

/**
 * The machine's own disk, as an upload is written to it.
 *
 * The body is streamed to a hidden file beside where it is going and moved into place only once all
 * of it has arrived, so a scan never finds half a film and a connection that drops leaves nothing
 * behind. Nothing already there is ever replaced. What the disk refuses — a mount that is
 * read-only, a folder Valence may not write — is told apart from any other failure, since the fix
 * for the first two is a setting on the machine.
 *
 * A file too large for one request, as one sent through a proxy with a cap on what it passes, comes
 * in pieces instead: a hidden staging file is begun beside where it is going, each piece is written
 * at its own place in it — so a piece sent twice lands in the same place — and it is cut to the size
 * it was said to be and moved into place once whole, as a single upload is.
 *
 * @returns The disk.
 */
const createUploadDisk = (): UploadDisk => ({
  write: async (destination, body): Promise<UploadResult> => {
    const partial = join(dirname(destination), `.${basename(destination)}.${randomUUID()}.part`);

    try {
      if (await isThere(destination)) {
        return { kind: 'exists' };
      }

      await mkdir(dirname(destination), { recursive: true });
      await pipeline(Readable.fromWeb(body), createWriteStream(partial, { flags: 'wx' }));

      if (await isThere(destination)) {
        await rm(partial, { force: true });

        return { kind: 'exists' };
      }

      await rename(partial, destination);

      return { kind: 'written', bytes: (await stat(destination)).size };
    } catch (error) {
      await rm(partial, { force: true }).catch(() => undefined);

      return refusalOf(error instanceof Error ? error : null);
    }
  },

  begin: async (destination, staging) => {
    try {
      if (await isThere(destination)) {
        return { kind: 'exists' };
      }

      await mkdir(dirname(destination), { recursive: true });
      await writeFile(staging, new Uint8Array(), { flag: 'wx' });

      return { kind: 'begun' };
    } catch (error) {
      return refusalOf(error instanceof Error ? error : null);
    }
  },

  writeAt: async (staging, offset, body) => {
    try {
      const into = createWriteStream(staging, { flags: 'r+', start: offset });

      await pipeline(Readable.fromWeb(body), into);

      return { kind: 'written', bytes: into.bytesWritten };
    } catch (error) {
      return refusalOf(error instanceof Error ? error : null);
    }
  },

  finish: async (staging, destination, bytes) => {
    try {
      if (await isThere(destination)) {
        return { kind: 'exists' };
      }

      await truncate(staging, bytes);
      await rename(staging, destination);

      return { kind: 'written', bytes: (await stat(destination)).size };
    } catch (error) {
      return refusalOf(error instanceof Error ? error : null);
    }
  },

  discard: async (staging) => {
    await rm(staging, { force: true }).catch(() => undefined);
  },
});

export { createUploadDisk };

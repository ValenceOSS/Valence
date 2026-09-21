import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { access, mkdir, rename, rm, stat } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { UploadDisk, UploadResult } from '@ValenceServer/uploads/UploadDisk';

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
 * The machine's own disk, as an upload is written to it.
 *
 * The body is streamed to a hidden file beside where it is going and moved into place only once all
 * of it has arrived, so a scan never finds half a film and a connection that drops leaves nothing
 * behind. Nothing already there is ever replaced. What the disk refuses — a mount that is
 * read-only, a folder Valence may not write — is told apart from any other failure, since the fix
 * for the first two is a setting on the machine.
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

      const code = error instanceof Error ? codeOf(error) : null;

      if (code === 'EROFS') {
        return { kind: 'readOnly' };
      }

      return code === 'EACCES' || code === 'EPERM' ? { kind: 'denied' } : { kind: 'failed' };
    }
  },
});

export { createUploadDisk };

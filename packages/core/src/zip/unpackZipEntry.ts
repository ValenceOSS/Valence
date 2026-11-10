import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createInflateRaw } from 'node:zlib';
import { zipEntryDataAt } from '@ValenceCore/zip/zipEntryDataAt';
import type { ZipEntry } from '@ValenceCore/zip/readZipDirectory';

/**
 * Writes one entry of a zip to a file of its own, a piece at a time, so an entry of gigabytes never
 * has to be held whole. A file half written when it fails is taken away again.
 *
 * @param zipPath - The zip.
 * @param entry - The entry, as the zip's directory lists it.
 * @param toPath - Where to write it.
 * @returns Whether it was written.
 */
const unpackZipEntry = async (
  zipPath: string,
  entry: ZipEntry,
  toPath: string,
): Promise<boolean> => {
  const file = await open(zipPath, 'r').catch(() => null);
  const at = file === null ? null : await zipEntryDataAt(file, entry).catch(() => null);

  await file?.close();

  if (at === null) {
    return false;
  }

  try {
    await mkdir(dirname(toPath), { recursive: true });
    await pipeline(
      createReadStream(zipPath, {
        start: at,
        end: at + Math.max(entry.compressedSize, 1) - 1,
      }),
      entry.isCompressed ? createInflateRaw() : new PassThrough(),
      createWriteStream(toPath),
    );

    return true;
  } catch {
    await rm(toPath, { force: true });

    return false;
  }
};

export { unpackZipEntry };

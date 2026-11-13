import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, rm, statfs } from 'node:fs/promises';
import { dirname } from 'node:path';
import { PassThrough, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createInflateRaw } from 'node:zlib';
import { judgeFreeSpace } from '@ValenceCore/functions/judgeFreeSpace';
import { zipEntryDataAt } from '@ValenceCore/zip/zipEntryDataAt';
import type { ZipEntry } from '@ValenceCore/zip/readZipDirectory';

const MOST_ENTRY_BYTES = 0xff_ff_ff_ff;

/**
 * Writes one entry of a zip to a file of its own, a piece at a time, so an entry of gigabytes never
 * has to be held whole. No more is written than the entry declares, and none where the disk has no
 * room for what it declares, so a small archive of highly compressed data cannot fill the disk. A
 * file half written when it fails is taken away again.
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
    const declared = Math.min(entry.uncompressedSize, MOST_ENTRY_BYTES);

    await mkdir(dirname(toPath), { recursive: true });

    const room = await statfs(dirname(toPath)).catch(() => null);

    if (
      judgeFreeSpace({
        bytes: declared,
        freeBytes: room === null ? null : room.bavail * room.bsize,
      }) === 'willNotFit'
    ) {
      return false;
    }

    let written = 0;

    await pipeline(
      createReadStream(zipPath, {
        start: at,
        end: at + Math.max(entry.compressedSize, 1) - 1,
      }),
      entry.isCompressed ? createInflateRaw() : new PassThrough(),
      new Transform({
        transform: (chunk: Buffer, _encoding, next) => {
          written += chunk.byteLength;
          next(written > declared ? new Error('That entry is bigger than it says') : null, chunk);
        },
      }),
      createWriteStream(toPath),
    );

    return true;
  } catch {
    await rm(toPath, { force: true });

    return false;
  }
};

export { unpackZipEntry };

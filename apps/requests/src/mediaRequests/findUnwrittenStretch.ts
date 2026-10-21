import { open } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';

const KIBIBYTE = 1024;

const MEBIBYTE = 1024 * KIBIBYTE;

const EVERY_BYTES = 4 * MEBIBYTE;

const LOOKED_AT_BYTES = 16 * KIBIBYTE;

const SMALLEST_STRETCH_BYTES = MEBIBYTE;

const SMALLEST_FILE_BYTES = 64 * MEBIBYTE;

const FURTHEST_BYTES = 256 * MEBIBYTE;

type UnwrittenStretch = { path: string; fromByte: number; bytes: number };

/**
 * Reads some bytes of a file into a buffer of their own.
 *
 * @param handle - The open file.
 * @param at - Where to read from.
 * @param length - How much to read.
 * @returns What was read, which is shorter at the end of the file.
 */
const readAt = async (handle: FileHandle, at: number, length: number): Promise<Uint8Array> => {
  const buffer = new Uint8Array(length);
  const { bytesRead } = await handle.read(buffer, 0, length, at);

  return buffer.subarray(0, bytesRead);
};

/**
 * Whether every byte read is zero, and anything was read at all.
 *
 * @param bytes - What was read.
 * @returns Whether it is all zeros.
 */
const isAllZeros = (bytes: Uint8Array): boolean =>
  bytes.length > 0 && bytes.every((byte) => byte === 0);

/**
 * How far a run of zeros goes from one point, one way, read a slice at a time.
 *
 * @param handle - The open file.
 * @param from - The first byte of a slice known to be zeros.
 * @param size - The file's size.
 * @param step - How far to move each time: forwards or backwards by a slice.
 * @returns How many bytes of zeros there are beyond that slice, up to a limit.
 */
const zerosBeyond = async (
  handle: FileHandle,
  from: number,
  size: number,
  step: number,
): Promise<number> => {
  let reached = 0;

  for (
    let at = from + step;
    at >= 0 && at < size && reached < FURTHEST_BYTES;
    at += step, reached += LOOKED_AT_BYTES
  ) {
    if (!isAllZeros(await readAt(handle, at, LOOKED_AT_BYTES))) {
      break;
    }
  }

  return reached;
};

/**
 * Looks through a finished torrent's large files for a stretch that was never written: a run of
 * zeros at least a mebibyte long. Picture and sound are compressed, so a run that long is not
 * something a film holds. It is what a torrent client leaves where it made the file whole first
 * and one piece of it never arrived, or arrived and never reached the disk, while still saying it
 * has every piece.
 *
 * Only a small slice every few mebibytes is read rather than the whole file, which would be the
 * whole download read again over a slow disk. Every piece of four mebibytes or more holds one of
 * those slices, and that is the size a torrent of a film or a season is cut into. A slice of zeros
 * is then followed both ways to see how far the run goes.
 *
 * @param files - The download's files.
 * @returns The first such stretch, or nothing where every file is whole.
 */
const findUnwrittenStretch = async (
  files: readonly DownloadedFile[],
): Promise<UnwrittenStretch | null> => {
  for (const file of files) {
    if (file.sizeBytes < SMALLEST_FILE_BYTES) {
      continue;
    }

    const handle = await open(file.path, 'r');

    try {
      for (let at = 0; at < file.sizeBytes; at += EVERY_BYTES) {
        if (!isAllZeros(await readAt(handle, at, LOOKED_AT_BYTES))) {
          continue;
        }

        const before = await zerosBeyond(handle, at, file.sizeBytes, -LOOKED_AT_BYTES);
        const after = await zerosBeyond(handle, at, file.sizeBytes, LOOKED_AT_BYTES);
        const bytes = before + LOOKED_AT_BYTES + after;

        if (bytes >= SMALLEST_STRETCH_BYTES) {
          return { path: file.path, fromByte: at - before, bytes };
        }
      }
    } finally {
      await handle.close();
    }
  }

  return null;
};

export type { UnwrittenStretch };

export { findUnwrittenStretch };

import { open } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import type { TorrentLayout } from '@ValenceRequests/downloads/TorrentLayout';

const KIBIBYTE = 1024;

const MEBIBYTE = 1024 * KIBIBYTE;

const LOOKED_AT_BYTES = 16 * KIBIBYTE;

const SMALLEST_FILE_BYTES = 64 * MEBIBYTE;

const SMALLEST_PIECE_PART_BYTES = 64 * KIBIBYTE;

const UNLAID_EVERY_BYTES = MEBIBYTE;

const UNLAID_SMALLEST_STRETCH_BYTES = MEBIBYTE;

const FURTHEST_BYTES = 256 * MEBIBYTE;

type UnwrittenStretch = { path: string; fromByte: number; bytes: number };

type LaidFile = TorrentLayout['files'][number];

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
 * Whether a stretch of a file is zeros from end to end, read a mebibyte at a time.
 *
 * @param handle - The open file.
 * @param from - Its first byte.
 * @param until - The byte after its last.
 * @returns Whether every byte of it is zero.
 */
const isZerosThroughout = async (
  handle: FileHandle,
  from: number,
  until: number,
): Promise<boolean> => {
  for (let at = from; at < until; at += MEBIBYTE) {
    if (!isAllZeros(await readAt(handle, at, Math.min(MEBIBYTE, until - at)))) {
      return false;
    }
  }

  return true;
};

/**
 * Finds which of a torrent's files a file on disk is. The client names each file from the
 * torrent's own folder down, so a file is matched by how its path ends.
 *
 * @param layout - The torrent's files.
 * @param path - The file on disk.
 * @returns Its place in the torrent, or nothing where the torrent does not name it.
 */
const placeOf = (layout: TorrentLayout, path: string): LaidFile | null => {
  const asked = path.replaceAll('\\', '/');

  return (
    layout.files.find((file) => {
      const name = file.name.replaceAll('\\', '/');

      return asked === name || asked.endsWith(`/${name}`);
    }) ?? null
  );
};

/**
 * Looks at every piece of a torrent that lies in one of its files. A piece that never reached the
 * disk is zeros from its first byte to its last, wherever it falls, so the start of each piece's
 * part of the file is read, and a part that starts with zeros is read through to see whether it is
 * zeros all the way. A part too short to matter, where a piece only grazes the file, is left out.
 *
 * @param handle - The open file.
 * @param sizeBytes - How long the file is.
 * @param placed - Where the file sits in the torrent.
 * @param pieceBytes - How long each piece is.
 * @returns The first part of a piece that is all zeros, or nothing.
 */
const unwrittenPiece = async (
  handle: FileHandle,
  sizeBytes: number,
  placed: LaidFile,
  pieceBytes: number,
): Promise<{ fromByte: number; bytes: number } | null> => {
  const first = Math.floor(placed.offsetBytes / pieceBytes);
  const last = Math.floor((placed.offsetBytes + sizeBytes - 1) / pieceBytes);

  for (let piece = first; piece <= last; piece += 1) {
    const from = Math.max(0, piece * pieceBytes - placed.offsetBytes);
    const until = Math.min(sizeBytes, (piece + 1) * pieceBytes - placed.offsetBytes);

    if (
      until - from >= SMALLEST_PIECE_PART_BYTES &&
      isAllZeros(await readAt(handle, from, Math.min(LOOKED_AT_BYTES, until - from))) &&
      (await isZerosThroughout(handle, from, until))
    ) {
      return { fromByte: from, bytes: until - from };
    }
  }

  return null;
};

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
 * Looks through a file for a run of zeros a mebibyte or longer without knowing where its pieces
 * fall, by reading a slice every mebibyte and following a slice of zeros both ways.
 *
 * @param handle - The open file.
 * @param sizeBytes - How long the file is.
 * @returns The first such run, or nothing.
 */
const unwrittenRun = async (
  handle: FileHandle,
  sizeBytes: number,
): Promise<{ fromByte: number; bytes: number } | null> => {
  for (let at = 0; at < sizeBytes; at += UNLAID_EVERY_BYTES) {
    if (!isAllZeros(await readAt(handle, at, LOOKED_AT_BYTES))) {
      continue;
    }

    const before = await zerosBeyond(handle, at, sizeBytes, -LOOKED_AT_BYTES);
    const after = await zerosBeyond(handle, at, sizeBytes, LOOKED_AT_BYTES);
    const bytes = before + LOOKED_AT_BYTES + after;

    if (bytes >= UNLAID_SMALLEST_STRETCH_BYTES) {
      return { fromByte: at - before, bytes };
    }
  }

  return null;
};

/**
 * Looks through a finished torrent's large files for a piece that was never written. A torrent
 * client that made each file whole first leaves a piece that never arrived, or arrived and never
 * reached the disk, as zeros, while still saying it has every piece. Picture and sound are
 * compressed, so a piece of nothing but zeros is not something a film holds.
 *
 * Where the client says how the torrent is laid out, the start of every piece is read, so a piece
 * that never arrived is found whatever size the torrent was cut into, for one small read a piece
 * rather than the whole download again. A file the client was told to skip is left out, since it
 * is zeros by design. Where the client cannot say, a slice is read every mebibyte instead, which
 * finds any run of zeros a mebibyte or longer.
 *
 * @param files - The download's files.
 * @param layout - How the client laid the torrent out, or nothing where it cannot say.
 * @returns The first such stretch, or nothing where every file is whole.
 */
const findUnwrittenStretch = async (
  files: readonly DownloadedFile[],
  layout: TorrentLayout | null,
): Promise<UnwrittenStretch | null> => {
  for (const file of files) {
    const placed = layout === null ? null : placeOf(layout, file.path);

    if (file.sizeBytes < SMALLEST_FILE_BYTES || placed?.isWanted === false) {
      continue;
    }

    const handle = await open(file.path, 'r');

    try {
      const found =
        layout === null || placed === null
          ? await unwrittenRun(handle, file.sizeBytes)
          : await unwrittenPiece(handle, file.sizeBytes, placed, layout.pieceBytes);

      if (found !== null) {
        return { path: file.path, ...found };
      }
    } finally {
      await handle.close();
    }
  }

  return null;
};

export type { UnwrittenStretch };

export { findUnwrittenStretch };

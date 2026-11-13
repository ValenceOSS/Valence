import { open } from 'node:fs/promises';
import { inflateSync } from 'fflate';
import { zipEntryDataAt } from '@ValenceCore/zip/zipEntryDataAt';
import type { ZipEntry } from '@ValenceCore/zip/readZipDirectory';

const MOST_ENTRY_BYTES = 256 * 1024 * 1024;

/**
 * Reads one file out of a zip, and only that one.
 *
 * The directory says where an entry's header is, but not where its bytes are: the header carries a
 * name and an extra field of its own, both of any length, so where the data starts can only be
 * learnt by reading it. Two small reads and one inflate, whatever else the archive holds.
 *
 * @param path - The archive.
 * @param entry - The entry, as the directory listed it.
 * @returns The file's bytes, or nothing where the archive disagrees with its own directory or the
 *   entry claims to be larger than any book's file is.
 */
const readZipEntry = async (path: string, entry: ZipEntry): Promise<Uint8Array | null> => {
  if (entry.compressedSize > MOST_ENTRY_BYTES || entry.uncompressedSize > MOST_ENTRY_BYTES) {
    return null;
  }

  const file = await open(path, 'r').catch(() => null);

  if (file === null) {
    return null;
  }

  try {
    const at = await zipEntryDataAt(file, entry);

    if (at === null) {
      return null;
    }

    const packed = Buffer.alloc(entry.compressedSize);

    await file.read(packed, 0, entry.compressedSize, at);

    if (!entry.isCompressed) {
      return new Uint8Array(packed);
    }

    return inflateSync(new Uint8Array(packed), { out: new Uint8Array(entry.uncompressedSize) });
  } catch {
    return null;
  } finally {
    await file.close();
  }
};

export { readZipEntry };

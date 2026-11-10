import type { FileHandle } from 'node:fs/promises';
import type { ZipEntry } from '@ValenceCore/zip/readZipDirectory';

const LOCAL_FILE_HEADER = 0x04_03_4b_50;

const LOCAL_MINIMUM = 30;

/**
 * Where an entry's packed bytes start in its zip, past the local header in front of them, whose
 * name and extra field can be longer than the central directory's copy says.
 *
 * @param file - The zip, open for reading.
 * @param entry - The entry, as the central directory lists it.
 * @returns The offset, or nothing where no local header is where the directory says.
 */
const zipEntryDataAt = async (file: FileHandle, entry: ZipEntry): Promise<number | null> => {
  const header = Buffer.alloc(LOCAL_MINIMUM);

  await file.read(header, 0, LOCAL_MINIMUM, entry.headerOffset);

  const reading = new DataView(header.buffer, header.byteOffset, header.byteLength);

  return reading.getUint32(0, true) === LOCAL_FILE_HEADER
    ? entry.headerOffset + LOCAL_MINIMUM + reading.getUint16(26, true) + reading.getUint16(28, true)
    : null;
};

export { zipEntryDataAt };

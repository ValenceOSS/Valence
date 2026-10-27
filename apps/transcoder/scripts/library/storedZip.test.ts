import { crc32 } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { storedZip } from './storedZip';

/**
 * Reads the entries back out of an archive by its central directory, as a reader would.
 *
 * @param zip - The archive.
 * @returns Each entry's name, its stored checksum, and its bytes.
 */
const readBack = (zip: Buffer) => {
  const end = zip.length - 22;
  const count = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  const found: { name: string; checksum: number; data: string }[] = [];

  for (let entry = 0; entry < count; entry += 1) {
    const nameLength = zip.readUInt16LE(at + 28);
    const name = zip.subarray(at + 46, at + 46 + nameLength).toString('utf8');
    const size = zip.readUInt32LE(at + 24);
    const local = zip.readUInt32LE(at + 42);
    const start = local + 30 + zip.readUInt16LE(local + 26);

    found.push({
      name,
      checksum: zip.readUInt32LE(at + 16),
      data: zip.subarray(start, start + size).toString('utf8'),
    });
    at += 46 + nameLength;
  }

  return found;
};

describe('storedZip', () => {
  it('ends in the record a reader finds the directory by', () => {
    const zip = storedZip([{ name: 'a.txt', data: Buffer.from('a') }]);

    expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50);
  });

  it('holds each entry, in order, as it was given', () => {
    const zip = storedZip([
      { name: 'mimetype', data: Buffer.from('application/epub+zip') },
      { name: 'OEBPS/chapter.xhtml', data: Buffer.from('<p>Héllo</p>') },
    ]);

    expect(readBack(zip)).toStrictEqual([
      {
        name: 'mimetype',
        checksum: crc32(Buffer.from('application/epub+zip')),
        data: 'application/epub+zip',
      },
      {
        name: 'OEBPS/chapter.xhtml',
        checksum: crc32(Buffer.from('<p>Héllo</p>')),
        data: '<p>Héllo</p>',
      },
    ]);
  });

  it('starts with the first entry, stored rather than squeezed', () => {
    const zip = storedZip([{ name: 'mimetype', data: Buffer.from('application/epub+zip') }]);

    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    expect(zip.readUInt16LE(8)).toBe(0);
    expect(zip.subarray(30, 38).toString('utf8')).toBe('mimetype');
  });
});

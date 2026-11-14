import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aStoredZip } from '@ValenceCore/testing/aStoredZip';
import { readZipDirectory } from './readZipDirectory';

const END = 0x06_05_4b_50;

/**
 * An end record alone, claiming a directory of the given size at the given place.
 */
const anEndRecord = (size: number, at: number): Buffer => {
  const end = Buffer.alloc(22);

  end.writeUInt32LE(END, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(at, 16);

  return end;
};

const inAFolder = async (name: string, bytes: Buffer): Promise<string> => {
  const path = join(await mkdtemp(join(tmpdir(), 'zip-')), name);

  await writeFile(path, bytes);

  return path;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readZipDirectory', () => {
  it('lists what a zip holds', async () => {
    const path = await inAFolder('a.zip', aStoredZip({ 'book.epub': 'the book' }));

    expect((await readZipDirectory(path))?.map((entry) => entry.name)).toEqual(['book.epub']);
  });

  it('reads nothing where the end record claims a directory bigger than the file, allocating nothing for it', async () => {
    const alloc = vi.spyOn(Buffer, 'alloc');
    const path = await inAFolder('forged.zip', anEndRecord(0xff_ff_ff_f0, 0));

    expect(await readZipDirectory(path)).toBeNull();
    expect(alloc.mock.calls.every(([size]) => size <= 16 * 1024 * 1024)).toBe(true);
  });

  it('reads nothing where the directory would run past the end of the file', async () => {
    const path = await inAFolder('short.zip', anEndRecord(1000, 10));

    expect(await readZipDirectory(path)).toBeNull();
  });

  it('reads nothing where an entry claims bytes beyond the end of the file', async () => {
    const zip = aStoredZip({ 'book.epub': 'the book' });
    const central = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));

    zip.writeUInt32LE(0x10_00_00_00, central + 20);

    expect(await readZipDirectory(await inAFolder('big.zip', zip))).toBeNull();
  });
});

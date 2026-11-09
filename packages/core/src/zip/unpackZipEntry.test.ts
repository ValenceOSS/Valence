import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aStoredZip } from '@ValenceCore/testing/aStoredZip';
import { readZipDirectory } from '@ValenceCore/zip/readZipDirectory';
import { unpackZipEntry } from './unpackZipEntry';

describe('unpackZipEntry', () => {
  it('writes an entry to a file of its own, making the folders it needs', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'zip-'));
    const zip = join(folder, 'a.zip');

    await writeFile(zip, aStoredZip({ 'book.epub': 'the book' }));

    const [entry] = (await readZipDirectory(zip)) ?? [];
    const to = join(folder, 'out', 'book.epub');

    expect(entry === undefined ? false : await unpackZipEntry(zip, entry, to)).toBe(true);
    expect(await readFile(to, 'utf8')).toBe('the book');
  });

  it('says so where the zip is not there', async () => {
    expect(
      await unpackZipEntry(
        join(tmpdir(), 'not-a-zip.zip'),
        { name: 'x', isCompressed: false, compressedSize: 1, uncompressedSize: 1, headerOffset: 0 },
        join(tmpdir(), 'x'),
      ),
    ).toBe(false);
  });
});

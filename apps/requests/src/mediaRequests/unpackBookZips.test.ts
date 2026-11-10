import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aStoredZip } from '@ValenceCore/testing/aStoredZip';
import { unpackBookZips } from './unpackBookZips';

/**
 * A download folder holding the given zips, listed as the download's files.
 *
 * @param zips - Each zip's name and what it holds.
 * @returns The folder and its files.
 */
const aDownload = async (zips: Readonly<Record<string, Readonly<Record<string, string>>>>) => {
  const folder = await mkdtemp(join(tmpdir(), 'download-'));
  const files = await Promise.all(
    Object.entries(zips).map(async ([name, held]) => {
      const bytes = aStoredZip(held);

      await writeFile(join(folder, name), bytes);

      return { path: join(folder, name), name, sizeBytes: bytes.length };
    }),
  );

  return { folder, files };
};

describe('unpackBookZips', () => {
  it('puts a zip’s books in its place, in a folder named after it', async () => {
    const { folder, files } = await aDownload({
      '06 - Lord of Chaos.zip': { 'Lord of Chaos.epub': 'book', 'notes.txt': 'not a book' },
    });
    const unpacked = await unpackBookZips(files);

    expect(unpacked.files.map((file) => file.name)).toEqual(['Lord of Chaos.epub']);
    expect(
      await readFile(
        join(folder, '.valence-unpacked', '06 - Lord of Chaos', 'Lord of Chaos.epub'),
        'utf8',
      ),
    ).toBe('book');
    expect(unpacked.folders).toEqual([join(folder, '.valence-unpacked')]);
  });

  it('offers a zip of pages as a comic', async () => {
    const pages = Object.fromEntries(
      Array.from({ length: 5 }, (_, at) => [`p${at.toString()}.jpg`, 'page']),
    );
    const { files } = await aDownload({ 'Some Manga v01.zip': pages });

    expect((await unpackBookZips(files)).files.map((file) => file.name)).toEqual([
      'Some Manga v01.cbz',
    ]);
  });

  it('passes over a name that would leave its folder', async () => {
    const { files } = await aDownload({ 'evil.zip': { '../../escaped.epub': 'bad' } });

    expect((await unpackBookZips(files)).files).toEqual([]);
  });
});

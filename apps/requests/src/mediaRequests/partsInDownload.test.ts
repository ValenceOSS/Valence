import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { partsInDownload } from './partsInDownload';

describe('partsInDownload', () => {
  it('reads the parts of an audiobook download from its files', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'parts-'));

    await mkdir(join(folder, 'Book'));
    await writeFile(join(folder, 'Book', 'Book - Part 1.mp3'), '');
    await writeFile(join(folder, 'Book', 'Book - Part 3.mp3'), '');
    await writeFile(join(folder, 'Book', 'Book.epub'), '');

    expect(await partsInDownload(folder, 'Book')).toEqual({ count: 3, missing: [2] });
  });

  it('reads the parts of the book asked for in a pack, not the pack as one book', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'parts-'));

    for (const path of [
      '1 - First/First.m4b',
      '2 - Second/Second - Part 1.mp3',
      '2 - Second/Second - Part 3.mp3',
      '4 - Fourth/Fourth.m4b',
    ]) {
      await mkdir(join(folder, path, '..'), { recursive: true });
      await writeFile(join(folder, path), '');
    }

    const untagged = () => Promise.resolve(null);

    expect(await partsInDownload(folder, 'Second', untagged)).toEqual({ count: 3, missing: [2] });
    expect(await partsInDownload(folder, 'First', untagged)).toEqual({ count: 1, missing: [] });
    expect(await partsInDownload(folder, 'Third', untagged)).toBeNull();
  });

  it('says nothing of a download with no audio', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'parts-'));

    await writeFile(join(folder, 'Book.epub'), '');

    expect(await partsInDownload(folder, 'Book')).toBeNull();
  });
});

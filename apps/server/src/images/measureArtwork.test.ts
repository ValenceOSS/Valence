import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { measureArtwork } from './measureArtwork';

const withArtwork = async (files: Record<string, number>): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'valence-artwork-'));

  for (const [name, bytes] of Object.entries(files)) {
    await writeFile(join(directory, name), Buffer.alloc(bytes));
  }

  return directory;
};

describe('measureArtwork', () => {
  it('says there is nothing rather than failing on a directory that is not there', async () => {
    await expect(measureArtwork('/nowhere-at-all')).resolves.toEqual({ count: 0, bytes: 0 });
  });

  it('adds up what the artwork costs', async () => {
    const directory = await withArtwork({ a: 100, b: 50 });

    expect((await measureArtwork(directory)).bytes).toBe(150);
  });

  it('counts posters rather than the files that describe them', async () => {
    const directory = await withArtwork({ a: 100, 'a.type': 10, b: 20, 'b.type': 10 });

    await expect(measureArtwork(directory)).resolves.toEqual({ count: 2, bytes: 140 });
  });

  it('leaves the book pages kept beside it to be counted on their own', async () => {
    const directory = await withArtwork({ a: 100 });

    await mkdir(join(directory, 'books'));

    await expect(measureArtwork(directory)).resolves.toEqual({ count: 1, bytes: 100 });
  });
});

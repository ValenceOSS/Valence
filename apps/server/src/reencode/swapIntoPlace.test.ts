import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { swapIntoPlace } from './swapIntoPlace';

const made: string[] = [];

type Shelf = {
  originalPath: string;
  encodePath: string;
  asidePath: string;
};

const aShelf = async (): Promise<Shelf> => {
  const root = await mkdtemp(join(tmpdir(), 'valence-swap-'));

  made.push(root);

  await mkdir(join(root, '.valence'), { recursive: true });
  await writeFile(join(root, 'Azkaban.mkv'), 'the remux');
  await writeFile(join(root, '.valence', 'abc.mkv'), 'the encode');

  return {
    originalPath: join(root, 'Azkaban.mkv'),
    encodePath: join(root, '.valence', 'abc.mkv'),
    asidePath: join(root, '.valence', 'abc.original.mkv'),
  };
};

afterEach(async () => {
  for (const path of made.splice(0)) {
    await rm(path, { recursive: true, force: true });
  }
});

describe('swapIntoPlace', () => {
  it('leaves the encode where the film was', async () => {
    const shelf = await aShelf();

    await swapIntoPlace(shelf);

    expect(await readFile(shelf.originalPath, 'utf8')).toBe('the encode');
  });

  it('keeps the original, rather than deleting anything', async () => {
    const shelf = await aShelf();

    await swapIntoPlace(shelf);

    expect(await readFile(shelf.asidePath, 'utf8')).toBe('the remux');
  });

  it('leaves the film exactly where it was when there is no encode to put there', async () => {
    const shelf = await aShelf();

    await rm(shelf.encodePath);

    await expect(swapIntoPlace(shelf)).rejects.toThrow();
    expect(await readFile(shelf.originalPath, 'utf8')).toBe('the remux');
    expect(existsSync(shelf.asidePath)).toBe(false);
  });

  it('does not touch the original when there is nothing at the path at all', async () => {
    const shelf = await aShelf();

    await rm(shelf.originalPath);

    await expect(swapIntoPlace(shelf)).rejects.toThrow();
    expect(existsSync(shelf.asidePath)).toBe(false);
  });
});

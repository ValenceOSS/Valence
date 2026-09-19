import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { restoreOriginal } from './restoreOriginal';
import { swapIntoPlace } from './swapIntoPlace';

const made: string[] = [];

type Shelf = {
  originalPath: string;
  encodePath: string;
  asidePath: string;
};

const aShelf = async (): Promise<Shelf> => {
  const root = await mkdtemp(join(tmpdir(), 'valence-restore-'));

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

describe('restoreOriginal', () => {
  it('puts the film back exactly as it was', async () => {
    const shelf = await aShelf();

    await swapIntoPlace(shelf);
    await restoreOriginal(shelf);

    expect(await readFile(shelf.originalPath, 'utf8')).toBe('the remux');
  });

  it('throws the encode away, since nobody wanted it', async () => {
    const shelf = await aShelf();

    await swapIntoPlace(shelf);
    await restoreOriginal(shelf);

    expect(existsSync(shelf.asidePath)).toBe(false);
    expect(existsSync(shelf.encodePath)).toBe(false);
  });

  it('undoes a swap exactly, so the round trip changes nothing', async () => {
    const shelf = await aShelf();
    const before = await readFile(shelf.originalPath, 'utf8');

    await swapIntoPlace(shelf);
    await restoreOriginal(shelf);

    expect(await readFile(shelf.originalPath, 'utf8')).toBe(before);
  });
});

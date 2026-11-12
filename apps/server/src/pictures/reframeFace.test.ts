import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { reframeFace } from './reframeFace';

const aFolderWithAnOriginal = async (name: string) => {
  const directory = await mkdtemp(join(tmpdir(), 'valence-faces-'));

  await mkdir(join(directory, 'originals'));
  await writeFile(
    join(directory, 'originals', name),
    await sharp({ create: { width: 2000, height: 2000, channels: 3, background: '#e8503a' } })
      .png()
      .toBuffer(),
  );

  return directory;
};

describe('reframeFace', () => {
  it('makes the framed picture again from the original, for a frame chosen afterwards', async () => {
    const directory = await aFolderWithAnOriginal('p1.png');

    await expect(reframeFace(directory, 'p1.png', { zoom: 4, x: 1, y: 1 })).resolves.toBe(true);
    expect((await sharp(join(directory, 'processed', 'p1.framed.webp')).metadata()).width).toBe(
      500,
    );
  });

  it('makes nothing for a face whose original is gone', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-faces-'));

    await expect(reframeFace(directory, 'p1.png', null)).resolves.toBe(false);
  });

  it('makes nothing for a moving face, which nothing frames', async () => {
    const directory = await aFolderWithAnOriginal('p1.mp4');

    await expect(reframeFace(directory, 'p1.mp4', null)).resolves.toBe(false);
  });
});

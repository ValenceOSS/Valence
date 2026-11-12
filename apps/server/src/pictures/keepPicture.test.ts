import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CROPS } from './CROPS';
import { keepPicture } from './keepPicture';

describe('keepPicture', () => {
  it('keeps the upload as it came among the originals, and its cleaned copy beside it', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-keep-'));
    const body = new Uint8Array(
      await sharp({ create: { width: 8, height: 8, channels: 3, background: '#3a8ee8' } })
        .png()
        .toBuffer(),
    );

    await expect(keepPicture(folder, 'a.png', body)).resolves.toBeNull();
    expect(await readFile(join(folder, 'originals', 'a.png'))).toEqual(Buffer.from(body));
    expect((await sharp(join(folder, 'processed', 'a.webp')).metadata()).format).toBe('webp');
  });

  it('hands out the part of the upload its frame chose, in its shape', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-keep-'));
    const body = new Uint8Array(
      await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#3a8ee8' } })
        .png()
        .toBuffer(),
    );

    await keepPicture(folder, 'a.png', body, {
      crop: CROPS.poster,
      frame: { zoom: 1, x: 1, y: 0 },
    });

    expect(await sharp(join(folder, 'processed', 'a.webp')).metadata()).toMatchObject({
      width: 600,
      height: 900,
    });
    expect(await readFile(join(folder, 'originals', 'a.png'))).toEqual(Buffer.from(body));
  });

  it('keeps nothing of an upload that will not read as a picture', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-keep-'));

    await expect(keepPicture(folder, 'a.png', new TextEncoder().encode('no'))).resolves.toBe(
      'unreadable',
    );
    expect(await readdir(folder)).toEqual([]);
  });
});

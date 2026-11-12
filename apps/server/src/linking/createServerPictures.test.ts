import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { createServerPictures } from './createServerPictures';

const aPhoto = async (format: 'png' | 'jpeg' = 'png') =>
  new Uint8Array(
    await sharp({ create: { width: 1600, height: 1600, channels: 3, background: '#3a8ee8' } })
      .toFormat(format)
      .toBuffer(),
  );

const aFolder = () => mkdtemp(join(tmpdir(), 'valence-servers-'));

describe('createServerPictures', () => {
  it('keeps the upload and shows only the square made from it', async () => {
    const directory = await aFolder();
    const pictures = createServerPictures(directory);

    await expect(
      pictures.save('own', { body: await aPhoto(), contentType: 'image/png' }),
    ).resolves.toBeNull();

    const shown = await pictures.read('own');

    expect(shown?.contentType).toBe('image/webp');
    expect((await sharp(shown?.body).metadata()).width).toBe(512);
    expect(await readdir(join(directory, 'originals'))).toEqual(['own.png']);
  });

  it('replaces a picture kept as another kind', async () => {
    const directory = await aFolder();
    const pictures = createServerPictures(directory);

    await pictures.save('own', { body: await aPhoto(), contentType: 'image/png' });
    await pictures.save('own', { body: await aPhoto('jpeg'), contentType: 'image/jpeg' });

    expect(await readdir(join(directory, 'originals'))).toEqual(['own.jpg']);
  });

  it('removes the upload and its processed picture both', async () => {
    const directory = await aFolder();
    const pictures = createServerPictures(directory);

    await pictures.save('own', { body: await aPhoto(), contentType: 'image/png' });
    await pictures.remove('own');

    await expect(pictures.read('own')).resolves.toBeNull();
    expect(await readdir(join(directory, 'originals'))).toEqual([]);
  });

  it('refuses what is not a picture, keeping nothing', async () => {
    const directory = await aFolder();
    const pictures = createServerPictures(directory);

    await expect(
      pictures.save('own', { body: new TextEncoder().encode('no'), contentType: 'image/png' }),
    ).resolves.not.toBeNull();
    await expect(pictures.read('own')).resolves.toBeNull();
  });

  it('brings pictures kept loose before up to date', async () => {
    const directory = await aFolder();
    const pictures = createServerPictures(directory);

    await writeFile(join(directory, 'own.png'), await aPhoto());
    await pictures.upgrade(vi.fn());

    expect((await pictures.read('own'))?.contentType).toBe('image/webp');
    expect(await readdir(join(directory, 'originals'))).toEqual(['own.png']);
  });
});

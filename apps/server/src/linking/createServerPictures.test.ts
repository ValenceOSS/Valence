import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
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

  it('cuts the part of a server’s picture its frame chose, and cuts it again the same way', async () => {
    const directory = await aFolder();
    const pictures = createServerPictures(directory);
    const wide = new Uint8Array(
      await sharp({ create: { width: 1600, height: 800, channels: 3, background: '#3a8ee8' } })
        .png()
        .toBuffer(),
    );

    await pictures.save('own', { body: wide, contentType: 'image/png' }, { zoom: 2, x: 1, y: 0 });

    expect(await readdir(directory)).toContain('own.frame.json');

    await rm(join(directory, 'processed', 'own.framed.webp'));
    await pictures.upgrade(vi.fn());

    expect((await sharp((await pictures.read('own'))?.body).metadata()).width).toBe(400);
  });

  it('hands out a picture drawn whole as it is, rather than its middle', async () => {
    const pictures = createServerPictures(await aFolder(), false);
    const wide = new Uint8Array(
      await sharp({ create: { width: 1600, height: 400, channels: 3, background: '#3a8ee8' } })
        .png()
        .toBuffer(),
    );

    await pictures.save('channel', { body: wide, contentType: 'image/png' });

    expect(await sharp((await pictures.read('channel'))?.body).metadata()).toMatchObject({
      width: 1600,
      height: 400,
    });
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

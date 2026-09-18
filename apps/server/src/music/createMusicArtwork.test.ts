import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { createMusicArtwork } from './createMusicArtwork';

const aPicture = async (width: number, height: number): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: { r: 200, g: 20, b: 20 } } })
      .jpeg()
      .toBuffer(),
  );

describe('createMusicArtwork', () => {
  it('keeps a cover from inside a track as WebP, no wider than a screen needs', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-art-'));

    const kept = await createMusicArtwork(directory).keep('album', 'a1', {
      picture: { bytes: await aPicture(3000, 3000), contentType: 'image/jpeg' },
    });

    expect(kept).toBe(join(directory, 'album-a1.webp'));

    const drawn = await sharp(kept ?? '').metadata();

    expect(drawn.format).toBe('webp');
    expect(drawn.width).toBe(1000);
  });

  it('keeps a picture read from beside the music', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-art-'));
    const source = join(directory, 'artist.jpg');

    await writeFile(source, await aPicture(400, 300));

    const kept = await createMusicArtwork(directory).keep('artist', 'x', { path: source });

    expect((await sharp(kept ?? '').metadata()).width).toBe(400);
  });

  it('keeps nothing from a picture that will not draw', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-art-'));

    await expect(
      createMusicArtwork(directory).keep('album', 'a1', {
        picture: { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/jpeg' },
      }),
    ).resolves.toBeNull();
  });

  it('keeps nothing from a file that is not there', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-art-'));

    await expect(
      createMusicArtwork(directory).keep('artist', 'x', { path: '/nowhere.jpg' }),
    ).resolves.toBeNull();
  });
});

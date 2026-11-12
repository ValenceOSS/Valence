import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { keepFace } from './keepFace';

const aFolder = () => mkdtemp(join(tmpdir(), 'valence-faces-'));

const aPhoto = async () =>
  new Uint8Array(
    await sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#e8503a' } })
      .png()
      .toBuffer(),
  );

describe('keepFace', () => {
  it('keeps the upload exactly as it came, and the whole and framed pictures made from it', async () => {
    const directory = await aFolder();
    const photo = await aPhoto();

    await expect(keepFace(directory, 'p1.png', photo, { zoom: 2, x: 0, y: 0 })).resolves.toBeNull();

    expect(new Uint8Array(await readFile(join(directory, 'originals', 'p1.png')))).toEqual(photo);

    const made = await sharp(await readFile(join(directory, 'processed', 'p1.webp'))).metadata();

    expect([made.format, made.width]).toEqual(['webp', 1024]);

    const framed = await sharp(
      await readFile(join(directory, 'processed', 'p1.framed.webp')),
    ).metadata();

    expect([framed.width, framed.height]).toEqual([500, 500]);
  });

  it('keeps nothing of a picture it cannot read', async () => {
    const directory = await aFolder();

    await expect(
      keepFace(directory, 'p1.png', new TextEncoder().encode('nope'), null),
    ).resolves.toBe('unreadable');
    await expect(readFile(join(directory, 'originals', 'p1.png'))).rejects.toThrow();
  });
});

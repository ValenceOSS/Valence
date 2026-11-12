import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
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

  it('keeps nothing of an upload that will not read as a picture', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-keep-'));

    await expect(keepPicture(folder, 'a.png', new TextEncoder().encode('no'))).resolves.toBe(
      'unreadable',
    );
    expect(await readdir(folder)).toEqual([]);
  });
});

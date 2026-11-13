import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { diskPictureAddress } from '@ValenceServer/library/diskPictureAddress';
import { uploadPictureAddress } from '@ValenceServer/library/uploadPictureAddress';
import { forgetRawLocalCopies } from './forgetRawLocalCopies';

const UPLOADED = uploadPictureAddress('00000000-0000-4000-8000-000000000001');

const BESIDE = diskPictureAddress('/films/Film (2020)/poster.jpg');

const CLEANED = uploadPictureAddress('00000000-0000-4000-8000-000000000002');

const nameFor = (url: string) => Buffer.from(url).toString('hex');

describe('forgetRawLocalCopies', () => {
  it('lets go of raw copies of this server’s pictures, once each, and nothing else', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-cache-'));
    const forget = vi.fn(() => Promise.resolve());
    const raw = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#000' } })
      .jpeg()
      .toBuffer();
    const clean = await sharp(raw).webp().toBuffer();

    for (const [url, body, type] of [
      [UPLOADED, raw, 'image/jpeg'],
      [BESIDE, raw, 'image/jpeg'],
      [CLEANED, clean, 'image/webp'],
      ['https://images.example/a.jpg', raw, 'image/jpeg'],
    ] as const) {
      await writeFile(join(directory, nameFor(url)), body);
      await writeFile(join(directory, `${nameFor(url)}.type`), type);
    }

    await expect(
      forgetRawLocalCopies(
        [UPLOADED, UPLOADED, BESIDE, CLEANED, 'https://images.example/a.jpg', null],
        { directory, nameFor, forget },
      ),
    ).resolves.toBe(2);
    expect(forget.mock.calls).toEqual([[UPLOADED], [BESIDE]]);
  });

  it('passes over a picture the cache has no copy of', async () => {
    const forget = vi.fn(() => Promise.resolve());

    await expect(
      forgetRawLocalCopies([UPLOADED], {
        directory: await mkdtemp(join(tmpdir(), 'valence-cache-')),
        nameFor,
        forget,
      }),
    ).resolves.toBe(0);
    expect(forget).not.toHaveBeenCalled();
  });
});

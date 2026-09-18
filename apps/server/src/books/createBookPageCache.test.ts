import { mkdtemp, readdir, stat, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { createBookPageCache } from './createBookPageCache';
import type { BookPageBytes } from './BookFile';

const aPage = async (): Promise<BookPageBytes> => ({
  bytes: new Uint8Array(
    await sharp({
      create: { width: 2000, height: 3000, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .jpeg()
      .toBuffer(),
  ),
  contentType: 'image/jpeg',
});

const build = async (page: BookPageBytes | null = null) => {
  const directory = await mkdtemp(join(tmpdir(), 'valence-pages-'));
  const held = page ?? (await aPage());
  const openPage = vi.fn(() => Promise.resolve<BookPageBytes | null>(held));

  return { directory, openPage, pageOf: createBookPageCache({ directory, openPage }) };
};

describe('createBookPageCache', () => {
  it('reads a page out of its book once, and from the cache after that', async () => {
    const { openPage, pageOf } = await build();

    await pageOf('ch_1', 0, 1280);
    await pageOf('ch_1', 0, 1280);

    expect(openPage).toHaveBeenCalledTimes(1);
  });

  it('keeps one copy for every window that rounds to the same width', async () => {
    const { directory, openPage, pageOf } = await build();

    await pageOf('ch_1', 0, 1171);
    await pageOf('ch_1', 0, 1240);

    expect(openPage).toHaveBeenCalledTimes(1);
    expect(await readdir(join(directory, 'ch_1'))).toEqual(['0@1280.webp']);
  });

  it('draws a page no narrower than it was asked for', async () => {
    const { pageOf } = await build();

    const page = await pageOf('ch_1', 0, 1171);
    const drawn = await sharp(page?.bytes).metadata();

    expect(drawn.width).toBe(1280);
    expect(page?.contentType).toBe('image/webp');
  });

  it('reads a full-size page out of its book every time, and keeps nothing', async () => {
    const { directory, openPage, pageOf } = await build();

    await pageOf('ch_1', 0);
    await pageOf('ch_1', 0);

    expect(openPage).toHaveBeenCalledTimes(2);
    await expect(readdir(directory)).resolves.toEqual([]);
  });

  it('marks a chapter read whenever one of its pages is served from the cache', async () => {
    const { directory, pageOf } = await build();
    const long = new Date('2020-01-01T00:00:00Z');

    await pageOf('ch_1', 0, 1280);
    await utimes(join(directory, 'ch_1'), long, long);
    await pageOf('ch_1', 0, 1280);

    expect((await stat(join(directory, 'ch_1'))).mtimeMs).toBeGreaterThan(long.getTime());
  });

  it('answers nothing for a page its book does not have', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'valence-pages-'));
    const pageOf = createBookPageCache({ directory, openPage: () => Promise.resolve(null) });

    await expect(pageOf('ch_1', 99, 1280)).resolves.toBeNull();
  });
});

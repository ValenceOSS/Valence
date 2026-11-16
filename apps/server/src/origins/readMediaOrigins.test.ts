import { link, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { readMediaOrigins } from '@ValenceServer/origins/readMediaOrigins';
import { createMemoryMediaOriginStore } from '@ValenceServer/origins/createMemoryMediaOriginStore';

describe('readMediaOrigins', () => {
  it('puts together what was filed, what was recorded and what the disk says', async () => {
    const recorded = createMemoryMediaOriginStore();

    await recorded.record([
      { libraryId: 'films', path: '/films/Up.mkv', source: 'upload', via: null },
    ]);

    const origins = await readMediaOrigins(
      ['/films/Heat.mkv', '/films/Up.mkv', '/films/Alien.mkv'],
      {
        recorded,
        filed: () =>
          Promise.resolve({
            '/films/Heat.mkv': { source: 'download', via: 'qBittorrent', release: null },
          }),
        linkOf: (path) => Promise.resolve(path === '/films/Heat.mkv' ? 'linked' : 'alone'),
      },
    );

    expect(origins).toEqual({
      '/films/Heat.mkv': { source: 'download', via: 'qBittorrent', link: 'linked' },
      '/films/Up.mkv': { source: 'upload', via: null, link: 'alone' },
      '/films/Alien.mkv': { source: 'disk', via: null, link: 'alone' },
    });
  });

  it('asks the requests service a few hundred at a time, and goes on without it when it fails', async () => {
    const filed = vi.fn(() => Promise.reject(new Error('down')));
    const paths = Array.from({ length: 501 }, (_, at) => `/films/${at.toString()}.mkv`);
    const origins = await readMediaOrigins(paths, {
      recorded: createMemoryMediaOriginStore(),
      filed,
      linkOf: () => Promise.resolve(null),
    });

    expect(filed).toHaveBeenCalledTimes(2);
    expect(origins['/films/500.mkv']).toEqual({ source: 'disk', via: null, link: null });
  });

  it('reads from the disk itself whether each file is linked when nothing else is given to', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'origins-'));
    const seeding = join(folder, 'seeding.mkv');
    const alone = join(folder, 'alone.mkv');

    await writeFile(seeding, '');
    await link(seeding, join(folder, 'placed.mkv'));
    await writeFile(alone, '');

    try {
      const origins = await readMediaOrigins([seeding, alone, join(folder, 'gone.mkv')], {
        recorded: createMemoryMediaOriginStore(),
        filed: () => Promise.resolve({}),
      });

      expect([seeding, alone, join(folder, 'gone.mkv')].map((path) => origins[path]?.link)).toEqual(
        ['linked', 'alone', null],
      );
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });

  it('asks nothing of no files', async () => {
    const filed = vi.fn(() => Promise.resolve({}));

    expect(await readMediaOrigins([], { recorded: createMemoryMediaOriginStore(), filed })).toEqual(
      {},
    );
    expect(filed).not.toHaveBeenCalled();
  });
});

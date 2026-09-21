import { describe, expect, it, vi } from 'vitest';
import { readEveryEpisode } from '@ValenceServer/library/readEveryEpisode';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const episode = (id: string): MediaSummary => ({
  id,
  libraryId: 'library',
  title: id,
  year: 2024,
  durationSeconds: 1421,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-01T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'A programme',
  seasonNumber: 1,
  episodeNumber: 1,
});

const reader = (all: readonly string[]) =>
  vi.fn((limit: number, offset: number) =>
    Promise.resolve({
      items: all.slice(offset, offset + limit).map(episode),
      total: all.length,
    }),
  );

describe('readEveryEpisode', () => {
  it('reads past the first page', async () => {
    const readPage = reader(['a', 'b', 'c', 'd', 'e']);

    const episodes = await readEveryEpisode({ readPage, pageSize: 2 });

    expect(episodes?.map((one) => one.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(readPage).toHaveBeenCalledTimes(3);
  });

  it('reads once where everything fits in a page', async () => {
    const readPage = reader(['a', 'b']);

    await readEveryEpisode({ readPage, pageSize: 10 });

    expect(readPage).toHaveBeenCalledTimes(1);
  });

  it('is null where the library cannot be seen', async () => {
    expect(
      await readEveryEpisode({ readPage: () => Promise.resolve(null), pageSize: 10 }),
    ).toBeNull();
  });

  it('stops on an empty page rather than asking for ever', async () => {
    const readPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [episode('a')], total: 5 })
      .mockResolvedValueOnce({ items: [], total: 5 });

    const episodes = await readEveryEpisode({ readPage, pageSize: 1 });

    expect(episodes).toHaveLength(1);
    expect(readPage).toHaveBeenCalledTimes(2);
  });
});

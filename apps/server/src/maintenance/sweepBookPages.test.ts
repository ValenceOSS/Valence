import { describe, expect, it, vi } from 'vitest';
import { sweepBookPages } from './sweepBookPages';
import type { BookPageFiles, CachedChapter } from './sweepBookPages';

const DAY = 24 * 60 * 60 * 1000;

const NOW = Date.parse('2026-09-18T00:00:00Z');

const filesWith = (chapters: CachedChapter[], pages: Record<string, string[]> = {}) => {
  const files = {
    listChapters: vi.fn(() => Promise.resolve(chapters)),
    listPages: vi.fn((path: string) => Promise.resolve(pages[path.split('/').pop() ?? ''] ?? [])),
    removeChapter: vi.fn(() => Promise.resolve()),
    removePage: vi.fn(() => Promise.resolve()),
    setLastRead: vi.fn(() => Promise.resolve()),
  } satisfies BookPageFiles;

  return files;
};

describe('sweepBookPages', () => {
  it('drops a chapter nobody has opened for a month', async () => {
    const files = filesWith([{ name: 'ch_1', lastReadMs: NOW - 31 * DAY }]);

    const removed = await sweepBookPages({
      directory: '/cache/books',
      files,
      listChapterIds: () => Promise.resolve(['ch_1']),
      nowMs: NOW,
    });

    expect(files.removeChapter).toHaveBeenCalledWith('/cache/books/ch_1');
    expect(removed).toBe(1);
  });

  it('keeps a chapter somebody is still reading', async () => {
    const files = filesWith([{ name: 'ch_1', lastReadMs: NOW - DAY }], {
      ch_1: ['0@1280.webp', '1@1280.webp'],
    });

    const removed = await sweepBookPages({
      directory: '/cache/books',
      files,
      listChapterIds: () => Promise.resolve(['ch_1']),
      nowMs: NOW,
    });

    expect(files.removeChapter).not.toHaveBeenCalled();
    expect(files.removePage).not.toHaveBeenCalled();
    expect(removed).toBe(0);
  });

  it('drops the pages of a chapter that is not on the shelf any more, however recently read', async () => {
    const files = filesWith([{ name: 'ch_gone', lastReadMs: NOW }]);

    await sweepBookPages({
      directory: '/cache/books',
      files,
      listChapterIds: () => Promise.resolve([]),
      nowMs: NOW,
    });

    expect(files.removeChapter).toHaveBeenCalledWith('/cache/books/ch_gone');
  });

  it('waits as long as it is told to before a chapter counts as unread', async () => {
    const files = filesWith([{ name: 'ch_1', lastReadMs: NOW - 3 * DAY }]);

    await sweepBookPages({
      directory: '/cache/books',
      files,
      listChapterIds: () => Promise.resolve(['ch_1']),
      nowMs: NOW,
      unreadForMs: 2 * DAY,
    });

    expect(files.removeChapter).toHaveBeenCalled();
  });

  it('removes full-size copies and widths the cache no longer rounds to', async () => {
    const files = filesWith([{ name: 'ch_1', lastReadMs: NOW - DAY }], {
      ch_1: ['0.jpg', '0@1171.webp', '0@1280.webp'],
    });

    const removed = await sweepBookPages({
      directory: '/cache/books',
      files,
      listChapterIds: () => Promise.resolve(['ch_1']),
      nowMs: NOW,
    });

    expect(files.removePage.mock.calls).toEqual([
      ['/cache/books/ch_1/0.jpg'],
      ['/cache/books/ch_1/0@1171.webp'],
    ]);
    expect(removed).toBe(2);
  });

  it('puts a chapter’s last-read time back after tidying it, since tidying is not reading', async () => {
    const lastReadMs = NOW - 5 * DAY;
    const files = filesWith([{ name: 'ch_1', lastReadMs }], { ch_1: ['0.jpg'] });

    await sweepBookPages({
      directory: '/cache/books',
      files,
      listChapterIds: () => Promise.resolve(['ch_1']),
      nowMs: NOW,
    });

    expect(files.setLastRead).toHaveBeenCalledWith('/cache/books/ch_1', lastReadMs);
  });

  it('reports what it could not remove and carries on', async () => {
    const onProblem = vi.fn();
    const files = filesWith([
      { name: 'ch_1', lastReadMs: 0 },
      { name: 'ch_2', lastReadMs: 0 },
    ]);

    files.removeChapter.mockRejectedValueOnce(new Error('busy'));

    const removed = await sweepBookPages({
      directory: '/cache/books',
      files,
      listChapterIds: () => Promise.resolve([]),
      nowMs: NOW,
      onProblem,
    });

    expect(onProblem).toHaveBeenCalledWith('/cache/books/ch_1', 'busy');
    expect(removed).toBe(1);
  });

  it('says how far through the chapters it is', async () => {
    const onProgress = vi.fn();

    await sweepBookPages({
      directory: '/cache/books',
      files: filesWith([{ name: 'ch_1', lastReadMs: NOW }]),
      listChapterIds: () => Promise.resolve(['ch_1']),
      nowMs: NOW,
      onProgress,
    });

    expect(onProgress.mock.calls).toEqual([
      [0, 1],
      [1, 1],
    ]);
  });
});

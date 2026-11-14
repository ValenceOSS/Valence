import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('node-unrar-js');
  vi.doUnmock('node:fs/promises');
  vi.resetModules();
});

const extract = vi.fn(() => ({ files: [] }));

const header = (name: string, unpSize: number) => ({
  name,
  unpSize,
  flags: { directory: false },
});

describe('openComicRar limits', () => {
  it('skips a picture whose header declares more than a page can be, and never inflates it', async () => {
    vi.resetModules();
    vi.doMock('node:fs/promises', () => ({
      stat: () => Promise.resolve({ size: 1024 }),
      readFile: () => Promise.resolve(new Uint8Array(8)),
    }));
    vi.doMock('node-unrar-js', () => ({
      createExtractorFromData: () =>
        Promise.resolve({
          getFileList: () => ({
            fileHeaders: [
              header('1.jpg', 10 ** 12),
              header('2.jpg', 1000),
              header('ComicInfo.xml', 10 ** 10),
            ],
          }),
          extract,
        }),
    }));

    const { openComicRar } = await import('./openComicRar');
    const book = await openComicRar('/books/a.cbr');

    expect(book?.layout === 'fixed' ? book.pageCount : null).toBe(1);
    expect(extract).not.toHaveBeenCalled();
  });

  it('refuses an archive larger than any comic is', async () => {
    vi.resetModules();
    vi.doMock('node:fs/promises', () => ({
      stat: () => Promise.resolve({ size: 2 * 1024 ** 3 }),
      readFile: () => Promise.reject(new Error('read it all')),
    }));

    const { openComicRar } = await import('./openComicRar');

    const problems: (string | null)[] = [];

    const book = await openComicRar('/books/huge.cbr', (reason) => problems.push(reason.code));

    expect(book).toBeNull();
    expect(problems).toEqual(['server.books.openComicRar.thatComicIsLargerThanA']);
  });
});

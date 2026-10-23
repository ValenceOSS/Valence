import { describe, expect, it, vi } from 'vitest';
import { readEveryPage } from '@ValenceClient/query/readEveryPage';

describe('readEveryPage', () => {
  it('reads page after page until one comes back short', async () => {
    const list = Array.from({ length: 7 }, (_, at) => at);
    const readPage = vi.fn((offset: number, limit: number) =>
      Promise.resolve(list.slice(offset, offset + limit)),
    );

    await expect(readEveryPage(readPage, 3)).resolves.toEqual(list);
    expect(readPage.mock.calls).toEqual([
      [0, 3],
      [3, 3],
      [6, 3],
    ]);
  });

  it('asks once more after a full last page, and stops at the empty one', async () => {
    const readPage = vi.fn((offset: number) => Promise.resolve(offset === 0 ? [1, 2] : []));

    await expect(readEveryPage(readPage, 2)).resolves.toEqual([1, 2]);
    expect(readPage).toHaveBeenCalledTimes(2);
  });

  it('fails rather than reading for ever where every page comes back full', async () => {
    const readPage = vi.fn(() => Promise.resolve([1, 2]));

    await expect(readEveryPage(readPage, 2)).rejects.toThrow();
    expect(readPage).toHaveBeenCalledTimes(100);
  });
});

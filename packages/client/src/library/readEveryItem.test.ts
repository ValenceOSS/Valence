import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readEveryItem } from '@ValenceClient/library/readEveryItem';

const fetchItemsAcrossMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchItemsAcross: fetchItemsAcrossMock,
}));

const TOTAL = 450;

beforeEach(() => {
  fetchItemsAcrossMock.mockReset();
  fetchItemsAcrossMock.mockImplementation(
    (_ids: readonly string[], options: { limit: number; offset: number }) =>
      Promise.resolve({
        items: Array.from(
          { length: Math.max(0, Math.min(options.limit, TOTAL - options.offset)) },
          (_, at) => ({ id: `item-${(options.offset + at).toString()}` }),
        ),
        total: TOTAL,
      }),
  );
});

describe('readEveryItem', () => {
  it('reads past the first page until it has everything, in order', async () => {
    const items = await readEveryItem(['films']);

    expect(items).toHaveLength(TOTAL);
    expect(items[0]).toEqual({ id: 'item-0' });
    expect(items.at(-1)).toEqual({ id: 'item-449' });
    expect(fetchItemsAcrossMock).toHaveBeenCalledTimes(3);
  });

  it('carries the question to every page', async () => {
    await readEveryItem(['films'], { kind: 'films', genre: 'Drama' });

    for (const [, options] of fetchItemsAcrossMock.mock.calls) {
      expect(options).toMatchObject({ kind: 'films', genre: 'Drama', limit: 200 });
    }
  });

  it('asks once where the first page holds everything', async () => {
    fetchItemsAcrossMock.mockResolvedValue({ items: [{ id: 'a' }], total: 1 });

    await readEveryItem(['films']);

    expect(fetchItemsAcrossMock).toHaveBeenCalledTimes(1);
  });
});

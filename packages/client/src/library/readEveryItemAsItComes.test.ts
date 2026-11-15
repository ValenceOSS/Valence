import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readEveryItemAsItComes } from '@ValenceClient/library/readEveryItemAsItComes';

const fetchItemsAcrossMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchItemsAcross: fetchItemsAcrossMock,
}));

const TOTAL = 3_450;

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

describe('readEveryItemAsItComes', () => {
  it('hands over the first page before asking for any other', async () => {
    const pages = readEveryItemAsItComes(['films']);
    const first = await pages.next();

    expect(first.value).toHaveLength(200);
    expect(fetchItemsAcrossMock).toHaveBeenCalledTimes(1);
  });

  it('then hands over each group of pages read together, in order', async () => {
    const sizes: number[] = [];
    const ids: string[] = [];

    for await (const page of readEveryItemAsItComes(['films'], { kind: 'films' })) {
      sizes.push(page.length);
      ids.push(...page.map((item) => item.id));
    }

    expect(sizes).toEqual([200, 3_200, 50]);
    expect(ids[0]).toBe('item-0');
    expect(ids.at(-1)).toBe('item-3449');
    expect(new Set(ids).size).toBe(TOTAL);
  });

  it('asks the later pages uncounted, with the same question', async () => {
    for await (const page of readEveryItemAsItComes(['films'], { genres: ['Drama'] })) {
      expect(page.length).toBeGreaterThan(0);
    }

    const [, ...later] = fetchItemsAcrossMock.mock.calls;

    for (const [, options, isCounted] of later) {
      expect(options).toMatchObject({ genres: ['Drama'], limit: 200 });
      expect(isCounted).toBe(false);
    }
  });

  it('reads and hands over nothing more once it is no longer wanted', async () => {
    const stop = new AbortController();
    const pages = readEveryItemAsItComes(['films'], {}, stop.signal);

    await pages.next();
    stop.abort();

    await expect(pages.next()).resolves.toEqual({ done: true, value: undefined });
    expect(fetchItemsAcrossMock).toHaveBeenCalledTimes(1);
  });
});

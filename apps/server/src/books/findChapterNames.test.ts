import { describe, expect, it, vi } from 'vitest';
import { findChapterNames } from './findChapterNames';

const ID = '11111111-2222-4333-8444-555555555555';

const answer = (body: object, ok = true): Promise<Response> =>
  Promise.resolve(new Response(JSON.stringify(body), { status: ok ? 200 : 503 }));

const series = (title: string, altTitles: object[] = []) => ({
  data: [{ id: ID, attributes: { title: { en: title }, altTitles } }],
});

const chapter = (number: string | null, title: string | null) => ({
  attributes: { chapter: number, title },
});

describe('findChapterNames', () => {
  it('names each chapter of the series whose title reads the same', async () => {
    const ask = vi.fn<(url: string) => Promise<Response>>((url) =>
      url.includes('/feed')
        ? answer({
            data: [
              chapter('1', 'Rental Girlfriend'),
              chapter('1', 'Another group'),
              chapter('2.5', ' Extra '),
            ],
            total: 3,
          })
        : answer(series('Kanojo, Okarishimasu', [{ en: 'Rent-A-Girlfriend' }])),
    );

    const names = await findChapterNames(ask, 'Rent A Girlfriend');

    expect([...names]).toEqual([
      [1, 'Rental Girlfriend'],
      [2.5, 'Extra'],
    ]);
    expect(ask.mock.calls[0]?.[0]).toContain('title=Rent+A+Girlfriend');
    expect(ask.mock.calls[1]?.[0]).toContain(`/manga/${ID}/feed`);
  });

  it('skips chapters with no number or no title', async () => {
    const ask = vi.fn<(url: string) => Promise<Response>>((url) =>
      url.includes('/feed')
        ? answer({
            data: [chapter(null, 'Oneshot'), chapter('3', null), chapter('4', '')],
            total: 3,
          })
        : answer(series('Blame')),
    );

    await expect(findChapterNames(ask, 'Blame')).resolves.toEqual(new Map());
  });

  it('reads every page of a long feed', async () => {
    const ask = vi.fn<(url: string) => Promise<Response>>((url) =>
      url.includes('offset=500')
        ? answer({ data: [chapter('501', 'Late')], total: 501 })
        : url.includes('/feed')
          ? answer({ data: [chapter('1', 'Early')], total: 501 })
          : answer(series('Long')),
    );

    const names = await findChapterNames(ask, 'Long');

    expect(names.get(501)).toBe('Late');
    expect(ask).toHaveBeenCalledTimes(3);
  });

  it('renames nothing from a series that only nearly matches', async () => {
    const ask = vi.fn<(url: string) => Promise<Response>>(() =>
      answer(series('Rent-A-Girlfriend Pilot')),
    );

    await expect(findChapterNames(ask, 'Rent-A-Girlfriend')).resolves.toEqual(new Map());
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('gives up quietly where MangaDex cannot be reached or answers oddly', async () => {
    await expect(
      findChapterNames(() => Promise.reject(new Error('offline')), 'Blame'),
    ).resolves.toEqual(new Map());
    await expect(findChapterNames(() => answer({}, false), 'Blame')).resolves.toEqual(new Map());
    await expect(findChapterNames(() => answer({ data: 'no' }), 'Blame')).resolves.toEqual(
      new Map(),
    );
  });

  it('asks nothing for a name with no letters in it', async () => {
    const ask = vi.fn<(url: string) => Promise<Response>>(() => answer(series('x')));

    await expect(findChapterNames(ask, '  ')).resolves.toEqual(new Map());
    expect(ask).not.toHaveBeenCalled();
  });
});

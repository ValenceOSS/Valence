import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSeasonSource } from './fetchSeasonSource';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSeasonSource', () => {
  it('reads which show’s season a season is read from', async () => {
    const state = {
      source: { externalId: '900', externalSeason: 1, title: 'Show', year: 2026 },
      canChoose: true,
    };
    const fetching = vi.fn((_url: string) =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(state) }),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(fetchSeasonSource('file')).resolves.toEqual(state);
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/media/file/season-source');
  });
});

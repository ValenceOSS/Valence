import { describe, expect, it } from 'vitest';
import { aFakeArr } from './aFakeArr';

describe('aFakeArr', () => {
  it('answers from its table, keeps what it was asked, and lacks anything else', async () => {
    const arr = aFakeArr({
      'GET /api/v3/movie': { body: [] },
      'POST /api/v3/movie': (asked) => ({ status: 201, body: { echoed: asked.body } }),
      'PUT /api/v3/movie/editor': { status: 202, body: null },
    });
    const signal = AbortSignal.timeout(1000);

    expect(
      await (
        await arr.fetch('http://radarr/api/v3/movie?tmdbId=1', {
          method: 'GET',
          headers: {},
          signal,
        })
      ).json(),
    ).toEqual([]);
    expect(
      await (
        await arr.fetch('http://radarr/api/v3/movie', {
          method: 'POST',
          headers: {},
          body: JSON.stringify({ tmdbId: 1 }),
          signal,
        })
      ).json(),
    ).toEqual({ echoed: { tmdbId: 1 } });
    expect(
      (await arr.fetch('http://radarr/api/v3/movie/editor', { method: 'PUT', headers: {}, signal }))
        .status,
    ).toBe(202);
    expect(
      (await arr.fetch('http://radarr/api/v3/nothing', { method: 'GET', headers: {}, signal }))
        .status,
    ).toBe(404);
    expect(arr.asked[0]?.query.get('tmdbId')).toBe('1');
    expect(arr.sent('POST', '/api/v3/movie')).toEqual([{ tmdbId: 1 }]);
  });
});

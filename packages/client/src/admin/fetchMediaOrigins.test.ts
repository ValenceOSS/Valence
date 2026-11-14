import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMediaOrigins } from '@ValenceClient/admin/fetchMediaOrigins';
import { MediaOriginsRequestSchema } from '@ValenceContracts/schemas/MediaOrigin';

describe('fetchMediaOrigins', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks a few hundred at a time and puts the answers together', async () => {
    const fetch = vi.fn((_: string, init: { body: string }) => {
      const { paths } = MediaOriginsRequestSchema.parse(JSON.parse(init.body));

      return Promise.resolve(
        Response.json({
          origins: Object.fromEntries(
            paths.map((path) => [path, { source: 'disk', via: null, link: 'alone' }]),
          ),
        }),
      );
    });

    vi.stubGlobal('fetch', fetch);

    const paths = Array.from({ length: 501 }, (_, at) => `/films/${at.toString()}.mkv`);
    const origins = await fetchMediaOrigins(paths);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(Object.keys(origins)).toHaveLength(501);
    expect(origins['/films/500.mkv']).toEqual({ source: 'disk', via: null, link: 'alone' });
  });

  it('asks nothing of no files', async () => {
    const fetch = vi.fn();

    vi.stubGlobal('fetch', fetch);

    expect(await fetchMediaOrigins([])).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });
});

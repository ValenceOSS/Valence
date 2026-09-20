import { describe, expect, it, vi } from 'vitest';
import { readDeezerCharts } from './readDeezerCharts';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

/**
 * A way out to the web that answers each address with what it is given.
 */
const aWeb = (answers: Record<string, JsonValue>) => {
  const web = {
    json: vi.fn((url: string): Promise<JsonValue | null> =>
      Promise.resolve(Object.entries(answers).find(([path]) => url.includes(path))?.[1] ?? null),
    ),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(null)),
  };

  return web satisfies MusicWeb;
};

describe('readDeezerCharts', () => {
  it('reads the charted albums and artists, skipping any it cannot read', async () => {
    const web = aWeb({
      '/chart/0/albums': {
        data: [
          { id: 1, title: 'Pylon', cover_medium: 'https://e/c.jpg', artist: { name: 'Band' } },
          { id: 'broken' },
        ],
      },
      '/chart/0/artists': { data: [{ id: 2, name: 'Taylor Swift', picture_medium: null }] },
    });

    expect(await readDeezerCharts(web)).toEqual({
      albums: [{ deezerId: 1, title: 'Pylon', artist: 'Band', coverUrl: 'https://e/c.jpg' }],
      artists: [{ deezerId: 2, name: 'Taylor Swift', pictureUrl: null }],
    });
  });

  it('reads nothing where Deezer could not be asked', async () => {
    expect(await readDeezerCharts(aWeb({}))).toEqual({ albums: [], artists: [] });
  });
});

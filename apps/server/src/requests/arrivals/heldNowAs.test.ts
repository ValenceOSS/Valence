import { describe, expect, it } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';
import { aShownRequestItem } from '@ValenceServer/testing/aShownRequestItem';
import { heldNowAs } from './heldNowAs';

const ALBUM = 'b1392450-e666-3926-a536-22c65f834433';

const LOOKUP = {
  films: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === '438631').map((id) => [id, 'a-film']))),
  series: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === '95396').map((id) => [id, 'a-show']))),
  albums: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === ALBUM).map((id) => [id, 'an-album']))),
};

describe('heldNowAs', () => {
  it('finds a film or a series by its catalogue id', async () => {
    expect(await heldNowAs(aShownRequest({ tmdbId: 438631 }), LOOKUP)).toBe('a-film');
    expect(await heldNowAs(aShownRequest({ kind: 'series', tmdbId: 95396 }), LOOKUP)).toBe(
      'a-show',
    );
  });

  it('finds an album by its recordings', async () => {
    const album = aShownRequest({
      kind: 'album',
      tmdbId: null,
      items: [aShownRequestItem({ musicBrainzId: ALBUM })],
    });

    expect(await heldNowAs(album, LOOKUP)).toBe('an-album');
  });

  it('has nothing where the library does not hold it, or it has no catalogue id', async () => {
    expect(await heldNowAs(aShownRequest({ tmdbId: 1 }), LOOKUP)).toBeNull();
    expect(await heldNowAs(aShownRequest({ tmdbId: null }), LOOKUP)).toBeNull();
  });
});

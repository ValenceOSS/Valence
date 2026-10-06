import { describe, expect, it } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';
import { aShownRequestItem } from '@ValenceServer/testing/aShownRequestItem';
import type { HeldKind } from '@ValenceServer/requests/arrivals/HeldKind';
import { matchDepartures } from './matchDepartures';

const ALBUM = 'b1392450-e666-3926-a536-22c65f834433';

const LOOKUP = {
  films: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === '438631').map((id) => [id, 'dune-again']))),
  series: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === '95396').map((id) => [id, 'severance']))),
  albums: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === ALBUM).map((id) => [id, 'ok-computer']))),
};

/**
 * Libraries holding only what the test names, of each kind.
 *
 * @param holding - The ids held.
 * @returns Which of those asked about are held.
 */
const holding =
  (...holding: string[]) =>
  (_kind: HeldKind, ids: readonly string[]) =>
    Promise.resolve(new Set(ids.filter((id) => holding.includes(id))));

const ARRIVED = [aShownRequestItem({ state: 'available' })];

describe('matchDepartures', () => {
  it('leaves alone a request whose item the library still holds, or that never arrived', async () => {
    const requests = [aShownRequest({ mediaId: 'dune', items: ARRIVED }), aShownRequest()];

    expect(await matchDepartures({ requests, held: holding('dune'), lookup: LOOKUP })).toEqual([]);
  });

  it('follows a request to the item a scan found its title as instead', async () => {
    const request = aShownRequest({ mediaId: 'dune', items: ARRIVED });

    expect(await matchDepartures({ requests: [request], held: holding(), lookup: LOOKUP })).toEqual(
      [{ request, mediaId: 'dune-again' }],
    );
  });

  it('lets a request go where the library holds its title no more', async () => {
    const film = aShownRequest({ tmdbId: 1, mediaId: 'gone', items: ARRIVED });
    const show = aShownRequest({ kind: 'series', tmdbId: 2, mediaId: 'gone-show' });
    const album = aShownRequest({
      kind: 'album',
      tmdbId: null,
      mediaId: 'gone-album',
      items: [aShownRequestItem({ musicBrainzId: 'c1392450-e666-3926-a536-22c65f834434' })],
    });

    expect(
      await matchDepartures({ requests: [film, show, album], held: holding(), lookup: LOOKUP }),
    ).toEqual([
      { request: film, mediaId: null },
      { request: show, mediaId: null },
      { request: album, mediaId: null },
    ]);
  });

  it('asks the libraries about each kind apart, and follows an album by its release group', async () => {
    const asked: [HeldKind, readonly string[]][] = [];
    const album = aShownRequest({
      kind: 'album',
      tmdbId: null,
      mediaId: 'old-album',
      items: [aShownRequestItem({ musicBrainzId: ALBUM })],
    });

    const departed = await matchDepartures({
      requests: [aShownRequest({ mediaId: 'dune' }), album],
      held: (kind, ids) => {
        asked.push([kind, ids]);

        return holding('dune')(kind, ids);
      },
      lookup: LOOKUP,
    });

    expect(asked).toEqual([
      ['film', ['dune']],
      ['album', ['old-album']],
    ]);
    expect(departed).toEqual([{ request: album, mediaId: 'ok-computer' }]);
  });

  it('does not follow books, which are not tied to an item this way', async () => {
    const book = aShownRequest({ kind: 'book', tmdbId: null, mediaId: 'a-book' });

    expect(await matchDepartures({ requests: [book], held: holding(), lookup: LOOKUP })).toEqual(
      [],
    );
  });
});

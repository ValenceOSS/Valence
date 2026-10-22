import { describe, expect, it } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';
import { aShownRequestItem } from '@ValenceServer/testing/aShownRequestItem';
import { matchRematches } from './matchRematches';

const LOOKUP = {
  films: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === '438631').map((id) => [id, 'right-copy']))),
  series: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === '95396').map((id) => [id, 'a-show']))),
  albums: () => Promise.resolve(new Map<string, string>()),
};

const ARRIVED = [aShownRequestItem({ state: 'available' })];

describe('matchRematches', () => {
  it('lets go a request whose film was just said to be another title', async () => {
    const request = aShownRequest({ tmdbId: 1, mediaId: 'wrong', items: ARRIVED });

    expect(
      await matchRematches({
        requests: [request],
        heldAs: new Map([['wrong', '2']]),
        lookup: LOOKUP,
      }),
    ).toEqual([{ request, mediaId: null }]);
  });

  it('follows a request to another copy of its title where the library has one', async () => {
    const request = aShownRequest({ tmdbId: 438631, mediaId: 'wrong', items: ARRIVED });

    expect(
      await matchRematches({
        requests: [request],
        heldAs: new Map([['wrong', '1']]),
        lookup: LOOKUP,
      }),
    ).toEqual([{ request, mediaId: 'right-copy' }]);
  });

  it('follows a series by the programme read again', async () => {
    const request = aShownRequest({ kind: 'series', tmdbId: 7, mediaId: 'a-show' });

    expect(
      await matchRematches({
        requests: [request],
        heldAs: new Map([['a-show', '95396']]),
        lookup: LOOKUP,
      }),
    ).toEqual([{ request, mediaId: null }]);
  });

  it('leaves alone a request still held as its title, or not read again at all', async () => {
    const kept = aShownRequest({ tmdbId: 5, mediaId: 'kept', items: ARRIVED });
    const elsewhere = aShownRequest({ tmdbId: 6, mediaId: 'elsewhere', items: ARRIVED });

    expect(
      await matchRematches({
        requests: [kept, elsewhere],
        heldAs: new Map([['kept', '5']]),
        lookup: LOOKUP,
      }),
    ).toEqual([]);
  });
});

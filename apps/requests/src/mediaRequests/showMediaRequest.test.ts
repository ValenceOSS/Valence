import { describe, expect, it } from 'vitest';
import { MediaRequestSchema } from '@ValenceContracts/schemas/MediaRequest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { showMediaRequest } from './showMediaRequest';

describe('showMediaRequest', () => {
  it('shows a request as the contract says, episodes in order', () => {
    const shown = showMediaRequest(aMediaRequest({ kind: 'series' }), [
      aRequestItem({ id: '2c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d', season: 1, episode: 2 }),
      aRequestItem({ season: 1, episode: 1, state: 'downloading' }),
    ]);

    expect(MediaRequestSchema.parse(shown)).toEqual(shown);
    expect(shown.items.map((item) => item.episode)).toEqual([1, 2]);
    expect(shown.state).toBe('downloading');
    expect(shown.requestedBy).toEqual({ id: 'someone', name: 'Someone' });
  });

  it('says the day a film is held until', () => {
    expect(showMediaRequest(aMediaRequest(), []).releaseDate).toBe('2021-12-03');
  });
});

import { describe, expect, it } from 'vitest';
import { itemFromDraft } from './itemFromDraft';

describe('itemFromDraft', () => {
  it('waits for a film or episode, nothing searched for yet', () => {
    expect(
      itemFromDraft(
        {
          musicBrainzId: null,
          season: 1,
          episode: 2,
          title: 'Half Loop',
          airDate: '2022-02-18',
          state: 'waiting',
        },
        'item',
        'request',
        '2026-09-19T00:00:00.000Z',
      ),
    ).toMatchObject({
      id: 'item',
      requestId: 'request',
      season: 1,
      episode: 2,
      state: 'waiting',
      lastSearchedAt: null,
    });
  });

  it('starts an episode the library already holds as there', () => {
    expect(
      itemFromDraft(
        {
          musicBrainzId: null,
          season: 1,
          episode: 1,
          title: 'Pilot',
          airDate: '2020-01-01',
          state: 'available',
        },
        'item',
        'request',
        '2026-09-19T00:00:00.000Z',
      ),
    ).toMatchObject({ state: 'available', lastSearchedAt: null });
  });
});

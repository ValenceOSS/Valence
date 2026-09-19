import { describe, expect, it } from 'vitest';
import { itemFromDraft } from './itemFromDraft';

describe('itemFromDraft', () => {
  it('waits for a film or episode, nothing searched for yet', () => {
    expect(
      itemFromDraft(
        { musicBrainzId: null, season: 1, episode: 2, title: 'Half Loop', airDate: '2022-02-18' },
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
});

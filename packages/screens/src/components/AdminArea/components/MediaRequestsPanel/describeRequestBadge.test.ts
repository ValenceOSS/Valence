import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { describeRequestBadge } from './describeRequestBadge';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const EPISODE: RequestItem = {
  id: '6ba7b810-9dad-11d1-80b4-000000000001',
  musicBrainzId: null,
  season: 1,
  episode: 1,
  title: '',
  airDate: '2026-10-02',
  state: 'waiting',
  problem: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('describeRequestBadge', () => {
  it('says what a request waits for', () => {
    expect(describeRequestBadge(aMediaRequest({ state: 'awaitingApproval' })).label).toBe(
      'Awaiting approval',
    );
    expect(describeRequestBadge(aMediaRequest({ state: 'waiting' })).detail).toBe(
      'Held until 3 Dec 2021, when its quality profile says it is out.',
    );
    expect(
      describeRequestBadge(aMediaRequest({ state: 'waiting', releaseDate: null })).detail,
    ).toBeNull();
    expect(
      describeRequestBadge(aMediaRequest({ state: 'waiting', kind: 'series', items: [EPISODE] }))
        .detail,
    ).toBe('The next episode airs 2 Oct 2026.');
    expect(
      describeRequestBadge(
        aMediaRequest({ state: 'waiting', kind: 'series', items: [{ ...EPISODE, airDate: null }] }),
      ).detail,
    ).toBe('Waiting for the next episode to be announced.');
    expect(
      describeRequestBadge(aMediaRequest({ state: 'waiting', kind: 'artist', items: [EPISODE] }))
        .detail,
    ).toBe('Out 2 Oct 2026.');
    expect(
      describeRequestBadge(
        aMediaRequest({ state: 'waiting', kind: 'album', items: [{ ...EPISODE, airDate: null }] }),
      ).detail,
    ).toBe('Waiting for the next album to be announced.');
  });

  it('says what went wrong, or what is on its way', () => {
    expect(
      describeRequestBadge(aMediaRequest({ state: 'refused', refusedBecause: 'No room' })),
    ).toEqual({ label: 'Refused', tone: 'danger', detail: 'No room' });
    expect(describeRequestBadge(aMediaRequest()).detail).toBe(
      'Searched for again every few hours.',
    );
    expect(describeRequestBadge(aMediaRequest({ isPickedByHand: true })).detail).toBe(
      'Waiting for a release to be picked by hand.',
    );
    expect(describeRequestBadge(aMediaRequest({ problem: 'Nothing yet' })).detail).toBe(
      'Nothing yet',
    );
    expect(
      describeRequestBadge(
        aMediaRequest({
          state: 'downloading',
          items: [{ ...EPISODE, state: 'downloading', releaseTitle: 'Dune.2021.1080p' }],
        }),
      ).detail,
    ).toBe('Dune.2021.1080p');
    expect(describeRequestBadge(aMediaRequest({ state: 'downloading' })).detail).toBeNull();
    expect(describeRequestBadge(aMediaRequest({ state: 'failed' })).detail).toBe('It failed.');
  });

  it('names every other state', () => {
    expect(
      (['searching', 'chosen', 'filing', 'filed', 'available'] as const).map(
        (state) => describeRequestBadge(aMediaRequest({ state })).label,
      ),
    ).toEqual(['Searching', 'Release chosen', 'Filing', 'Filed', 'Done']);
  });
});

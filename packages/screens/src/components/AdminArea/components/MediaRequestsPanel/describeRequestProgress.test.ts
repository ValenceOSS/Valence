import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { describeRequestProgress } from './describeRequestProgress';
import type { RequestItem, RequestItemState } from '@ValenceContracts/schemas/MediaRequest';

/**
 * An episode in the state given.
 */
const anEpisode = (episode: number, state: RequestItemState): RequestItem => ({
  id: `6ba7b810-9dad-11d1-80b4-${episode.toString().padStart(12, '0')}`,
  season: 1,
  episode,
  title: '',
  airDate: null,
  state,
  problem: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
});

describe('describeRequestProgress', () => {
  it('counts what of a series has aired and arrived', () => {
    expect(
      describeRequestProgress(
        aMediaRequest({
          kind: 'series',
          seasons: [1],
          items: [
            anEpisode(1, 'available'),
            anEpisode(2, 'filed'),
            anEpisode(3, 'downloading'),
            anEpisode(4, 'waiting'),
          ],
        }),
      ),
    ).toBe('Season 1 · 2 of 3 episodes here · 1 downloading');
    expect(
      describeRequestProgress(
        aMediaRequest({ kind: 'series', seasons: [1, 2], items: [anEpisode(1, 'wanted')] }),
      ),
    ).toBe('Seasons 1, 2 · 0 of 1 episode here');
    expect(describeRequestProgress(aMediaRequest({ kind: 'series' }))).toBe(
      'Every season · 0 of 0 episodes here',
    );
  });

  it('says nothing of a film', () => {
    expect(describeRequestProgress(aMediaRequest())).toBeNull();
  });
});

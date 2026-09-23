import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import type { RequestItem, RequestItemState } from '@ValenceContracts/schemas/MediaRequest';

/**
 * An episode in the state given.
 */
const anEpisode = (episode: number, state: RequestItemState): RequestItem => ({
  id: `6ba7b810-9dad-11d1-80b4-${episode.toString().padStart(12, '0')}`,
  musicBrainzId: null,
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
  downloadedBytes: null,
  downloadSeconds: null,
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

  it('counts what of an artist is out and has arrived, by the kinds watched for', () => {
    expect(
      describeRequestProgress(
        aMediaRequest({
          kind: 'artist',
          releaseTypes: ['album', 'live'],
          items: [anEpisode(1, 'available'), anEpisode(2, 'wanted'), anEpisode(3, 'waiting')],
        }),
      ),
    ).toBe('Albums, Live · 1 of 2 albums here');
  });

  it('says who an album is by', () => {
    expect(
      describeRequestProgress(aMediaRequest({ kind: 'album', artistName: 'Pink Floyd' })),
    ).toBe('By Pink Floyd');
    expect(describeRequestProgress(aMediaRequest({ kind: 'album' }))).toBeNull();
  });

  it('says nothing of a film', () => {
    expect(describeRequestProgress(aMediaRequest())).toBeNull();
  });
});

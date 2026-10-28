import { describe, expect, it } from 'vitest';
import { anchorsAmong } from './anchorsAmong';
import type { SegmentCandidate } from './SegmentProvider';

const episode = (mediaId: string): SegmentCandidate => ({
  mediaId,
  path: `/media/${mediaId}.mkv`,
  durationSeconds: 1440,
  isComplete: false,
  isCreditsComplete: false,
  probe: {
    container: 'mkv',
    durationSeconds: 1440,
    bitrateKbps: 4000,
    video: null,
    audioStreams: [],
    subtitleStreams: [],
    chapters: [],
  },
});

const printsOf = (...ids: string[]) => new Map(ids.map((mediaId) => [mediaId, { mediaId }]));

describe('anchorsAmong', () => {
  it('takes the first few in the order given', () => {
    expect(
      anchorsAmong(printsOf('a', 'b', 'c', 'd'), ['d', 'c', 'b', 'a'].map(episode), 3),
    ).toEqual([{ mediaId: 'd' }, { mediaId: 'c' }, { mediaId: 'b' }]);
  });

  it('passes over an episode that could not be listened to', () => {
    expect(anchorsAmong(printsOf('a', 'c', 'd'), ['a', 'b', 'c', 'd'].map(episode), 3)).toEqual([
      { mediaId: 'a' },
      { mediaId: 'c' },
      { mediaId: 'd' },
    ]);
  });

  it('takes an episode named twice once', () => {
    expect(anchorsAmong(printsOf('a', 'b'), ['a', 'a', 'b'].map(episode), 3)).toEqual([
      { mediaId: 'a' },
      { mediaId: 'b' },
    ]);
  });
});

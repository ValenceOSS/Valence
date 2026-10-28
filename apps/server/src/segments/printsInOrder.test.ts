import { describe, expect, it } from 'vitest';
import { printsInOrder } from './printsInOrder';
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

describe('printsInOrder', () => {
  it('keeps the order given', () => {
    expect(printsInOrder(printsOf('a', 'b', 'c'), ['c', 'a', 'b'].map(episode))).toEqual([
      { mediaId: 'c' },
      { mediaId: 'a' },
      { mediaId: 'b' },
    ]);
  });

  it('passes over an episode that could not be listened to', () => {
    expect(printsInOrder(printsOf('a', 'c'), ['a', 'b', 'c'].map(episode))).toEqual([
      { mediaId: 'a' },
      { mediaId: 'c' },
    ]);
  });

  it('takes an episode named twice once', () => {
    expect(printsInOrder(printsOf('a', 'b'), ['a', 'a', 'b'].map(episode))).toEqual([
      { mediaId: 'a' },
      { mediaId: 'b' },
    ]);
  });
});

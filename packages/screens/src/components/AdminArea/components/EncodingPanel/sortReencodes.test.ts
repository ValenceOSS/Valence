import { describe, expect, it } from 'vitest';
import type { Reencode, ReencodeState } from '@ValenceContracts/schemas/Reencode';
import { sortReencodes } from './sortReencodes';

const at = (id: string, state: ReencodeState): Reencode => ({
  id,
  mediaId: id,
  libraryId: id,
  title: 'Azkaban',
  seriesTitle: null,
  mode: 'replace',
  state,
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
  durationSeconds: 8520,
  originalSizeBytes: 70_000_000_000,
  estimatedBytes: 6_000_000_000,
  producedBytes: null,
  progress: 0,
  bytesPerSecond: null,
  failure: null,
  hasSample: false,
  askedAt: '2026-09-18T22:00:00.000Z',
  startedAt: null,
  encodedAt: null,
  reviewedAt: null,
});

describe('sortReencodes', () => {
  it('puts the ones waiting for somebody in their own group', () => {
    const sorted = sortReencodes([at('a', 'awaitingReview'), at('b', 'queued')]);

    expect(sorted.awaitingReview.map((one) => one.id)).toEqual(['a']);
  });

  it('counts everything still being worked on as under way', () => {
    const sorted = sortReencodes([at('a', 'queued'), at('b', 'encoding'), at('c', 'verifying')]);

    expect(sorted.underWay).toHaveLength(3);
  });

  it('counts everything that is over as settled, however it ended', () => {
    const sorted = sortReencodes([
      at('a', 'finished'),
      at('b', 'rejected'),
      at('c', 'failed'),
      at('d', 'cancelled'),
    ]);

    expect(sorted.settled).toHaveLength(4);
  });

  it('puts each one in exactly one group', () => {
    const all = [at('a', 'awaitingReview'), at('b', 'encoding'), at('c', 'finished')];
    const sorted = sortReencodes(all);

    expect(sorted.awaitingReview.length + sorted.underWay.length + sorted.settled.length).toBe(
      all.length,
    );
  });

  it('answers with three empty groups for nothing at all', () => {
    expect(sortReencodes([])).toEqual({ awaitingReview: [], underWay: [], settled: [] });
  });
});

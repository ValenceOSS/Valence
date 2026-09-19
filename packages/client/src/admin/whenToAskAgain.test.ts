import { describe, expect, it } from 'vitest';
import type { Reencode, ReencodeState } from '@ValenceContracts/schemas/Reencode';
import { ENCODING_EVERY_MS, whenToAskAgain } from './whenToAskAgain';

const at = (state: ReencodeState): Reencode => ({
  id: 'reencode-1',
  mediaId: 'media-1',
  libraryId: 'library-1',
  title: 'Life in a Year',
  seriesTitle: null,
  mode: 'replace',
  state,
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
  durationSeconds: 6000,
  originalSizeBytes: 4_000_000_000,
  estimatedBytes: 1_000_000_000,
  producedBytes: null,
  progress: 0.4,
  bytesPerSecond: null,
  failure: null,
  hasSample: false,
  askedAt: '2026-09-19T17:00:00.000Z',
  startedAt: null,
  encodedAt: null,
  reviewedAt: null,
});

describe('whenToAskAgain', () => {
  it('asks again while something is being encoded', () => {
    expect(whenToAskAgain([at('encoding')])).toBe(ENCODING_EVERY_MS);
  });

  it('asks again while something is queued or being checked', () => {
    expect(whenToAskAgain([at('queued')])).toBe(ENCODING_EVERY_MS);
    expect(whenToAskAgain([at('verifying')])).toBe(ENCODING_EVERY_MS);
  });

  it('stops asking once everything left is waiting on a person', () => {
    expect(whenToAskAgain([at('awaitingReview')])).toBe(false);
  });

  it('stops asking once everything is over, however it ended', () => {
    expect(whenToAskAgain([at('finished'), at('failed'), at('rejected'), at('cancelled')])).toBe(
      false,
    );
  });

  it('asks nothing of an empty queue', () => {
    expect(whenToAskAgain([])).toBe(false);
  });

  it('keeps asking while one of many is still being written', () => {
    expect(whenToAskAgain([at('finished'), at('encoding'), at('awaitingReview')])).toBe(
      ENCODING_EVERY_MS,
    );
  });
});

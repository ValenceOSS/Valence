import { describe, expect, it } from 'vitest';
import type { Reencode } from '@ValenceContracts/schemas/Reencode';
import { describeEncodeProgress } from './describeEncodeProgress';

const STARTED = '2026-09-19T19:00:00.000Z';

const at = (progress: number, overrides: Partial<Reencode> = {}): Reencode => ({
  id: 'reencode-1',
  mediaId: 'media-1',
  libraryId: 'library-1',
  title: "Charlie's Angels",
  seriesTitle: null,
  mode: 'replace',
  state: 'encoding',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
  durationSeconds: 5904,
  originalSizeBytes: 6_552_720_126,
  estimatedBytes: 2_900_000_000,
  producedBytes: null,
  progress,
  bytesPerSecond: 7_199_934,
  failure: null,
  hasSample: false,
  askedAt: STARTED,
  startedAt: STARTED,
  encodedAt: null,
  reviewedAt: null,
  ...overrides,
});

const after = (seconds: number) => Date.parse(STARTED) + seconds * 1000;

describe('describeEncodeProgress', () => {
  it('says how much faster than watching it, which is the thing worth knowing', () => {
    expect(describeEncodeProgress(at(0.26), after(180))).toContain('8.5× real time');
  });

  it('says how long is left', () => {
    expect(describeEncodeProgress(at(0.5), after(180))).toContain('about 3 minutes left');
  });

  it('rounds a long wait to hours rather than reciting minutes', () => {
    expect(describeEncodeProgress(at(0.1), after(1200))).toContain('hours left');
  });

  it('says a minute is nearly up rather than claiming zero', () => {
    expect(describeEncodeProgress(at(0.99), after(3000))).toContain('less than a minute');
  });

  it('says nothing before it has started', () => {
    expect(describeEncodeProgress(at(0.4, { startedAt: null }), after(180))).toBe('');
  });

  it('says nothing before there is any progress to reckon from', () => {
    expect(describeEncodeProgress(at(0), after(180))).toBe('');
  });

  it('says nothing rather than dividing by a moment that has not passed', () => {
    expect(describeEncodeProgress(at(0.4), Date.parse(STARTED))).toBe('');
  });
});

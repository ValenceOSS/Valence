import { describe, expect, it } from 'vitest';
import type { MediaProbe } from '@ValenceServer/transcoder/TranscoderClient';
import { factsFromProbe } from './factsFromProbe';

const probe: MediaProbe = {
  container: 'mkv',
  durationSeconds: 8520,
  bitrateKbps: 6000,
  canCopySegments: true,
  video: {
    index: 0,
    codec: 'hevc',
    codecTag: null,
    width: 1920,
    height: 1080,
    range: 'HDR10',
    rangeBase: 'HDR10',
    bitrateKbps: 5500,
    bitDepth: 10,
    level: 120,
    frameRate: 23.976,
    isInterlaced: false,
    refFrames: 4,
    pixelAspect: null,
    rotationDegrees: null,
  },
  audioStreams: [
    {
      index: 1,
      codec: 'eac3',
      channels: 6,
      sampleRate: 48000,
      profile: null,
      language: 'eng',
      title: null,
      isDefault: true,
      isAtmos: false,
    },
  ],
  subtitleStreams: [],
  chapters: [{ title: 'Opening', startSeconds: 0, endSeconds: 120 }],
};

describe('factsFromProbe', () => {
  it('reads everything the library records off the file it just wrote', () => {
    const facts = factsFromProbe({ probe, sizeBytes: 6_000_000_000, modifiedAtMs: 1_700_000 });

    expect(facts.videoCodec).toBe('hevc');
    expect(facts.height).toBe(1080);
    expect(facts.videoBitDepth).toBe(10);
    expect(facts.sizeBytes).toBe(6_000_000_000);
  });

  it('keeps the chapters, which segment detection already reads', () => {
    const facts = factsFromProbe({ probe, sizeBytes: 1, modifiedAtMs: 1 });

    expect(facts.chapters).toEqual([{ title: 'Opening', startSeconds: 0, endSeconds: 120 }]);
  });

  it('keeps the range, which is what decides whether a screen is sent HDR', () => {
    const facts = factsFromProbe({ probe, sizeBytes: 1, modifiedAtMs: 1 });

    expect(facts.videoRange).toBe('HDR10');
    expect(facts.videoRangeBase).toBe('HDR10');
  });

  it('survives a file whose picture could not be read, rather than throwing', () => {
    const facts = factsFromProbe({
      probe: { ...probe, video: null },
      sizeBytes: 1,
      modifiedAtMs: 1,
    });

    expect(facts.videoCodec).toBe('unknown');
    expect(facts.width).toBe(0);
  });

  it('takes the size and the time from the filesystem, which is the only thing that knows', () => {
    const facts = factsFromProbe({ probe, sizeBytes: 42, modifiedAtMs: 99 });

    expect(facts.sizeBytes).toBe(42);
    expect(facts.modifiedAtMs).toBe(99);
  });
});

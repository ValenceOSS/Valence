import { describe, expect, it } from 'vitest';
import { RenditionListSchema, RenditionSchema } from './Rendition';

const validRendition = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  mediaItemId: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
  kind: 'pinned',
  label: '1080p HEVC',
  quality: '1080p',
  sizeBytes: 6_000_000_000,
  container: 'mkv',
  durationSeconds: 7200,
  bitrateKbps: 6000,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  width: 1920,
  height: 1080,
  audioStreams: [{ index: 1, codec: 'eac3', channels: 6, language: 'eng', isAtmos: false }],
  subtitleStreams: [],
  createdAt: '2026-09-18T22:00:00.000Z',
};

describe('RenditionSchema', () => {
  it('accepts a rendition an encode produced', () => {
    const result = RenditionSchema.parse(validRendition);

    expect(result.label).toBe('1080p HEVC');
    expect(result.quality).toBe('1080p');
  });

  it('carries the same playback facts a media item does, so negotiation reads it unchanged', () => {
    const result = RenditionSchema.parse(validRendition);

    expect(result.videoBitDepth).toBe(8);
    expect(result.canCopySegments).toBe(true);
    expect(result.videoIsInterlaced).toBe(false);
  });

  it('accepts a rendition that matches no rung, because audio-only work changes none', () => {
    const result = RenditionSchema.parse({ ...validRendition, quality: null });

    expect(result.quality).toBeNull();
  });

  it('refuses a rendition with no audio at all', () => {
    expect(() => RenditionSchema.parse({ ...validRendition, audioStreams: [] })).toThrow();
  });

  it('reads a list of them', () => {
    const result = RenditionListSchema.parse({ renditions: [validRendition] });

    expect(result.renditions).toHaveLength(1);
  });
});

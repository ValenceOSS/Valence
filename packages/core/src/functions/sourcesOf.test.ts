import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import { sourcesOf } from './sourcesOf';

const remux: MediaItem = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Harry Potter and the Prisoner of Azkaban',
  container: 'mkv',
  durationSeconds: 8520,
  videoCodec: 'hevc',
  videoRange: 'HDR10',
  videoBitDepth: 10,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 66000,
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
  ],
  subtitleStreams: [],
};

const copy: MediaItem = { ...remux, width: 1920, height: 1080, bitrateKbps: 6000 };

const path = '/media/Films/Azkaban (2004)/Azkaban (2004).mkv';

describe('sourcesOf', () => {
  it('answers with the original alone where nothing was kept beside it', () => {
    expect(sourcesOf({ item: remux, path })).toEqual([
      { id: 'original', isOriginal: true, item: remux, path },
    ]);
  });

  it('puts the original first, so it is what anything falls back to', () => {
    const sources = sourcesOf({
      item: remux,
      path,
      renditions: [
        { id: 'kept', item: copy, path: '/media/Films/Azkaban (2004)/.valence/kept.mkv' },
      ],
    });

    expect(sources[0]?.isOriginal).toBe(true);
    expect(sources).toHaveLength(2);
  });

  it('marks a rendition as not the original, and keeps the id it is known by', () => {
    const sources = sourcesOf({
      item: remux,
      path,
      renditions: [
        { id: 'kept', item: copy, path: '/media/Films/Azkaban (2004)/.valence/kept.mkv' },
      ],
    });

    expect(sources[1]).toEqual({
      id: 'kept',
      isOriginal: false,
      item: copy,
      path: '/media/Films/Azkaban (2004)/.valence/kept.mkv',
    });
  });
});

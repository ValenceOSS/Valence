import { describe, expect, it } from 'vitest';
import {
  AUDIO_QUALITIES,
  AUDIO_QUALITY_DETAILS,
  AUDIO_QUALITY_KBPS,
  AUDIO_QUALITY_LABELS,
  LyricsSchema,
  MusicTrackSchema,
} from './Music';

const TRACK = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-000000000002',
  title: 'Caramel',
  artists: [{ id: '00000000-0000-4000-8000-000000000003', name: 'Sleep Token' }],
  album: { id: '00000000-0000-4000-8000-000000000004', title: 'Even In Arcadia', hasArtwork: true },
  discNumber: null,
  trackNumber: 5,
  durationSeconds: 300,
  codec: 'flac',
  isLossless: true,
  bitDepth: 24,
  sampleRate: 44_100,
  bitrateKbps: 1492,
  hasLyrics: false,
  isFavourite: false,
};

describe('Music', () => {
  it('names every quality it offers, and says what each costs', () => {
    for (const quality of AUDIO_QUALITIES) {
      expect(AUDIO_QUALITY_LABELS[quality]).not.toBe('');
      expect(AUDIO_QUALITY_DETAILS[quality]).not.toBe('');
    }
  });

  it('offers lower qualities from the highest down', () => {
    expect(AUDIO_QUALITY_KBPS.high).toBeGreaterThan(AUDIO_QUALITY_KBPS.normal);
    expect(AUDIO_QUALITY_KBPS.normal).toBeGreaterThan(AUDIO_QUALITY_KBPS.low);
  });

  it('reads a track', () => {
    expect(MusicTrackSchema.parse(TRACK)).toEqual(TRACK);
  });

  it('refuses a track with no title', () => {
    expect(MusicTrackSchema.safeParse({ ...TRACK, title: '' }).success).toBe(false);
  });

  it('reads plain lyrics, whose lines have no time', () => {
    expect(
      LyricsSchema.safeParse({ isSynced: false, lines: [{ atMs: null, text: 'x' }] }).success,
    ).toBe(true);
  });
});

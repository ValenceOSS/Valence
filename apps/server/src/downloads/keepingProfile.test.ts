import { describe, expect, it } from 'vitest';
import { chooseSource } from '@ValenceCore/functions/chooseSource';
import { sourcesOf } from '@ValenceCore/functions/sourcesOf';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import { keepingProfile } from './keepingProfile';

const remux: MediaItem = {
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  title: 'Arrival',
  container: 'mkv',
  durationSeconds: 7200,
  videoCodec: 'hevc',
  videoRange: 'HDR10',
  videoBitDepth: 10,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 24000,
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
  ],
  subtitleStreams: [],
};

const kept: MediaItem = {
  ...remux,
  id: '9c858901-8a57-4791-81fe-4c455b099bd0',
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  width: 1920,
  height: 1080,
  bitrateKbps: 4000,
  audioStreams: [
    { index: 1, codec: 'aac', channels: 2, language: 'eng', isDefault: true, isAtmos: false },
  ],
};

const sources = sourcesOf({
  item: remux,
  path: '/media/films/Arrival (2016)/Arrival (2016).mkv',
  renditions: [{ id: 'kept', item: kept, path: '/media/films/Arrival (2016)/.valence/kept.mkv' }],
});

describe('keepingProfile', () => {
  it('asks for H.264 in MP4, which is what every device made this century opens', () => {
    expect(keepingProfile().directPlayProfiles).toEqual([
      { container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac', 'mp3'] },
    ]);
  });

  it('builds a rung from a kept copy of it rather than encoding the remux again', () => {
    const chosen = chooseSource({
      sources,
      profile: keepingProfile(),
      requestedQuality: '1080p',
      neverSmaller: true,
    });

    expect(chosen?.source.id).toBe('kept');
    expect(chosen?.plan.video.kind).toBe('passthrough');
  });

  it('still encodes the remux for the original, which no smaller copy can stand in for', () => {
    const chosen = chooseSource({
      sources,
      profile: keepingProfile(),
      requestedQuality: 'original',
      neverSmaller: true,
    });

    expect(chosen?.source.isOriginal).toBe(true);
    expect(chosen?.plan.video.kind).toBe('transcode');
  });

  it('encodes the remux where nothing was kept beside it', () => {
    const chosen = chooseSource({
      sources: sourcesOf({ item: remux, path: '/media/films/Arrival (2016)/Arrival (2016).mkv' }),
      profile: keepingProfile(),
      requestedQuality: '1080p',
      neverSmaller: true,
    });

    expect(chosen?.source.isOriginal).toBe(true);
    expect(chosen?.plan.video.kind).toBe('transcode');
  });
});

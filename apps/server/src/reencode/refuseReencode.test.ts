import { describe, expect, it } from 'vitest';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';
import { refuseReencode } from './refuseReencode';

const remux: MediaItem = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Harry Potter and the Prisoner of Azkaban',
  container: 'mkv',
  durationSeconds: 8520,
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 66000,
  sizeBytes: 70_000_000_000,
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
  ],
  subtitleStreams: [],
};

const replacing: ReencodeSettings = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
};

const fine = {
  item: remux,
  settings: replacing,
  isAlreadyUnderWay: false,
  isBeingWatched: false,
  isFolderWritable: true,
};

describe('refuseReencode', () => {
  it('allows a remux that would genuinely get smaller', () => {
    expect(refuseReencode(fine)).toBeNull();
  });

  it('refuses one that is already queued, rather than queuing it twice', () => {
    expect(refuseReencode({ ...fine, isAlreadyUnderWay: true })?.code).toBe('AlreadyUnderWay');
  });

  it('refuses one somebody is watching, which replacing would end', () => {
    expect(refuseReencode({ ...fine, isBeingWatched: true })?.code).toBe('BeingWatched');
  });

  it('refuses a folder Valence cannot write to, and says why that is normal', () => {
    const refusal = refuseReencode({ ...fine, isFolderWritable: false });

    expect(refusal?.code).toBe('FolderIsReadOnly');
    expect(refusal?.detail).toContain('read only');
  });

  it('refuses work that would buy nothing', () => {
    const small: MediaItem = {
      ...remux,
      width: 1280,
      height: 720,
      bitrateKbps: 2000,
      sizeBytes: 2_400_000_000,
      audioStreams: [
        { index: 1, codec: 'aac', channels: 2, language: 'eng', isDefault: true, isAtmos: false },
      ],
    };

    expect(
      refuseReencode({
        ...fine,
        item: small,
        settings: { ...replacing, quality: '720p', videoCodec: 'h264' },
      })?.code,
    ).toBe('AlreadyAsSmall');
  });

  it('refuses a container that cannot hold the subtitles it already has', () => {
    const avi: MediaItem = {
      ...remux,
      container: 'avi',
      subtitleStreams: [{ index: 2, format: 'pgs', language: 'eng', isForced: false }],
    };

    expect(refuseReencode({ ...fine, item: avi })?.code).toBe('SubtitlesWouldNotSurvive');
  });

  it('allows that same container where there are no subtitles to lose', () => {
    expect(refuseReencode({ ...fine, item: { ...remux, container: 'avi' } })).toBeNull();
  });

  it('allows a bitmap track in a container that holds it, which is why mkv stays mkv', () => {
    const withPgs: MediaItem = {
      ...remux,
      subtitleStreams: [{ index: 2, format: 'pgs', language: 'eng', isForced: false }],
    };

    expect(refuseReencode({ ...fine, item: withPgs })).toBeNull();
  });

  it('names the most decisive reason where several are true at once', () => {
    expect(
      refuseReencode({
        ...fine,
        isAlreadyUnderWay: true,
        isBeingWatched: true,
        isFolderWritable: false,
      })?.code,
    ).toBe('AlreadyUnderWay');
  });
});

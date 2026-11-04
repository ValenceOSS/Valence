import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it } from 'vitest';
import { isStreamedNatively } from '@ValenceClient/playback/isStreamedNatively';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan, Reason } from '@ValenceContracts/schemas/PlaybackPlan';

const reason: Reason = { code: 'ClientSupportsSource', detail: sayVerbatim('Supported') };

const FILM: Pick<MediaItem, 'id' | 'videoCodec' | 'audioStreams'> = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  videoCodec: 'h264',
  audioStreams: [
    { index: 1, codec: 'eac3', channels: 6, language: 'jpn', isDefault: true, isAtmos: false },
    { index: 2, codec: 'aac', channels: 2, language: 'eng', isDefault: false, isAtmos: false },
  ],
};

const COPIED: PlaybackPlan = {
  mediaId: FILM.id,
  container: { kind: 'remux', target: 'fmp4', reason },
  video: { kind: 'passthrough', reason },
  audio: { kind: 'passthrough', streamIndex: 1, reason },
  subtitles: { kind: 'none', reason },
};

const BROWSER: DeviceProfile = {
  schemaVersion: 1,
  name: 'Browser',
  maxWidth: 1920,
  maxHeight: 1080,
  maxAudioChannels: 2,
  supportedVideoRanges: ['SDR'],
  tenBitVideoCodecs: [],
  maxVideoLevels: {},
  canPlayInterlaced: true,
  canPlayAnamorphic: true,
  canRotate: true,
  unsupportedAudioProfiles: [],
  supportedSubtitleFormats: ['webvtt'],
  directPlayProfiles: [
    { container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac', 'opus'] },
    { container: 'mkv', videoCodecs: ['h264'], audioCodecs: ['eac3'] },
  ],
  transcodingProfiles: [
    { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

describe('isStreamedNatively', () => {
  it('says no to a stream carrying a sound the element cannot stream', () => {
    expect(isStreamedNatively(BROWSER, COPIED, FILM)).toBe(false);
  });

  it('says yes once that sound is converted to one the element streams', () => {
    const converted: PlaybackPlan = {
      ...COPIED,
      audio: {
        kind: 'transcode',
        streamIndex: 1,
        codec: 'aac',
        channels: 2,
        maxBitrateKbps: 384,
        reason,
      },
    };

    expect(isStreamedNatively(BROWSER, converted, FILM)).toBe(true);
  });

  it('says yes to a copied track the element streams', () => {
    const english: PlaybackPlan = { ...COPIED, audio: { ...COPIED.audio, streamIndex: 2 } };

    expect(isStreamedNatively(BROWSER, english, FILM)).toBe(true);
  });

  it('reads an unnamed copied track as the file’s own first choice', () => {
    const natural: PlaybackPlan = { ...COPIED, audio: { ...COPIED.audio, streamIndex: null } };

    expect(isStreamedNatively(BROWSER, natural, FILM)).toBe(false);
  });

  it('says no to a copied picture the element cannot stream', () => {
    const hevc = { ...FILM, videoCodec: 'hevc' };
    const english: PlaybackPlan = { ...COPIED, audio: { ...COPIED.audio, streamIndex: 2 } };

    expect(isStreamedNatively(BROWSER, english, hevc)).toBe(false);
  });

  it('says yes to a film with no sound whose picture the element streams', () => {
    const silent = { ...FILM, audioStreams: [] };

    expect(isStreamedNatively(BROWSER, COPIED, silent)).toBe(true);
  });

  it('says no to a plan made for another copy of the film, whose codecs it cannot know', () => {
    const english: PlaybackPlan = { ...COPIED, audio: { ...COPIED.audio, streamIndex: 2 } };

    expect(
      isStreamedNatively(
        BROWSER,
        { ...english, mediaId: '9b2504e0-4f89-41d3-9a0c-0305e82c3302' },
        FILM,
      ),
    ).toBe(false);
  });

  it('judges the track asked for, which a stream copies in place of the plan’s', () => {
    const english: PlaybackPlan = { ...COPIED, audio: { ...COPIED.audio, streamIndex: 2 } };

    expect(isStreamedNatively(BROWSER, english, FILM, 1)).toBe(false);
    expect(isStreamedNatively(BROWSER, COPIED, FILM, 2)).toBe(true);
  });
});

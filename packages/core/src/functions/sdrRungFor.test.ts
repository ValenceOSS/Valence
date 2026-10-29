import { describe, expect, it } from 'vitest';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import { chooseSource } from './chooseSource';
import type { PlayableSource } from './chooseSource';
import { sdrRungFor } from './sdrRungFor';

const film: MediaItem = {
  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  title: 'A film',
  container: 'mkv',
  durationSeconds: 7800,
  videoCodec: 'hevc',
  videoRange: 'HDR10',
  videoBitDepth: 10,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 55000,
  audioStreams: [
    { index: 1, codec: 'dts', channels: 8, language: 'eng', isDefault: true, isAtmos: false },
  ],
  subtitleStreams: [],
};

const iPhone: DeviceProfile = {
  schemaVersion: 1,
  name: 'iPhone',
  maxWidth: 2868,
  maxHeight: 1320,
  maxAudioChannels: 8,
  supportedVideoRanges: ['SDR', 'HDR10', 'HLG'],
  tenBitVideoCodecs: ['hevc'],
  maxVideoLevels: { h264: 52, hevc: 153 },
  canPlayInterlaced: false,
  canPlayAnamorphic: true,
  canRotate: true,
  unsupportedAudioProfiles: [],
  supportedSubtitleFormats: ['webvtt'],
  directPlayProfiles: [
    { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'ac3', 'eac3'] },
  ],
  transcodingProfiles: [
    { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
  ],
};

const sourceOf = (item: MediaItem): PlayableSource => ({
  id: item.id,
  isOriginal: true,
  item,
  path: '/films/a-film.mkv',
});

const chosenFor = (item: MediaItem, profile: DeviceProfile) => {
  const chosen = chooseSource({ sources: [sourceOf(item)], profile });

  if (chosen === null) {
    throw new Error('nothing was chosen');
  }

  return chosen;
};

describe('sdrRungFor', () => {
  it('offers a tone mapped H.264 picture beside an HDR copy', () => {
    const rung = sdrRungFor(chosenFor(film, iPhone), iPhone, {});

    expect(rung?.plan.video).toMatchObject({ kind: 'transcode', codec: 'h264', range: 'SDR' });
  });

  it('keeps the sound the viewer chose', () => {
    const rung = sdrRungFor(chosenFor(film, iPhone), iPhone, {
      chosenSubtitleStreamIndex: null,
      preferredAudioLanguage: 'eng',
    });

    expect(rung?.plan.audio.streamIndex).toBe(1);
  });

  it('offers nothing beside an SDR copy', () => {
    const sdr = { ...film, videoRange: 'SDR' as const, videoBitDepth: 8 };

    expect(sdrRungFor(chosenFor(sdr, iPhone), iPhone, {})).toBeNull();
  });

  it('offers nothing beside a picture already being converted', () => {
    const sdrOnly = { ...iPhone, supportedVideoRanges: ['SDR' as const] };

    expect(sdrRungFor(chosenFor(film, sdrOnly), sdrOnly, {})).toBeNull();
  });
});

import { Platform } from 'react-native';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

const VIDEO = ['h264', 'hevc'];

const AUDIO = ['aac', 'ac3', 'eac3', 'alac', 'mp3'];

/**
 * What an Apple TV plays without help, which the server reads to decide what it may send as it is
 * and what it has to convert first.
 *
 * A browser has to be asked what it can play; an Apple TV is one known thing. Its player decodes
 * H.264 and HEVC, ten-bit HEVC included, in every range the television might show — Dolby Vision
 * and HDR10 as well as SDR — up to 4K, and passes Dolby Digital and Dolby Digital Plus through at up
 * to eight channels. What it cannot open whole it takes as HLS.
 *
 * @returns The profile.
 */
const anAppleTvsProfile = (): DeviceProfile =>
  DeviceProfileSchema.parse({
    schemaVersion: 1,
    name: 'Apple TV',
    maxWidth: 3840,
    maxHeight: 2160,
    maxAudioChannels: 8,
    supportedVideoRanges: ['SDR', 'HDR10', 'HLG', 'DolbyVision'],
    tenBitVideoCodecs: ['hevc'],
    maxVideoLevels: { h264: 52, hevc: 153 },
    canPlayInterlaced: false,
    supportedSubtitleFormats: ['webvtt'],
    directPlayProfiles: [
      { container: 'mp4', videoCodecs: VIDEO, audioCodecs: AUDIO },
      { container: 'mov', videoCodecs: VIDEO, audioCodecs: AUDIO },
    ],
    transcodingProfiles: [
      { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
    ],
  });

/**
 * What an Android TV plays without help. Android televisions are many boxes rather than one, so
 * this is what nearly all of them manage rather than what the best of them do: H.264 and HEVC, in
 * SDR, HDR10 and HLG, up to 4K, from an MP4 or a Matroska file, since ExoPlayer opens both — but not
 * Dolby Vision, which only some sets show. What it cannot open whole it takes as HLS.
 *
 * @returns The profile.
 */
const anAndroidTvsProfile = (): DeviceProfile =>
  DeviceProfileSchema.parse({
    schemaVersion: 1,
    name: 'Android TV',
    maxWidth: 3840,
    maxHeight: 2160,
    maxAudioChannels: 8,
    supportedVideoRanges: ['SDR', 'HDR10', 'HLG'],
    tenBitVideoCodecs: ['hevc'],
    maxVideoLevels: { h264: 52, hevc: 153 },
    canPlayInterlaced: false,
    supportedSubtitleFormats: ['webvtt'],
    directPlayProfiles: [
      { container: 'mp4', videoCodecs: VIDEO, audioCodecs: [...AUDIO, 'opus', 'flac'] },
      { container: 'mkv', videoCodecs: VIDEO, audioCodecs: [...AUDIO, 'opus', 'flac'] },
    ],
    transcodingProfiles: [
      { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
    ],
  });

/**
 * What this television plays without help, which the server reads to decide what it may send as it
 * is and what it has to convert first.
 *
 * @param system - Which system it runs, which is this television's own unless a test says otherwise.
 * @returns The profile.
 */
const theTvsProfile = (system: typeof Platform.OS = Platform.OS): DeviceProfile =>
  system === 'android' ? anAndroidTvsProfile() : anAppleTvsProfile();

export { theTvsProfile };

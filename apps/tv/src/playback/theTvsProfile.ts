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
const theTvsProfile = (): DeviceProfile =>
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

export { theTvsProfile };

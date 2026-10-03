import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

/**
 * A phone that plays H.264 in MP4 as it is and is sent HLS for anything else.
 *
 * @returns The profile.
 */
const aDeviceProfile = (): DeviceProfile =>
  DeviceProfileSchema.parse({
    schemaVersion: 1,
    name: 'Phone',
    maxWidth: 1920,
    maxHeight: 1080,
    maxAudioChannels: 2,
    supportedVideoRanges: ['SDR'],
    supportedSubtitleFormats: ['webvtt'],
    directPlayProfiles: [{ container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac'] }],
    transcodingProfiles: [
      { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
    ],
  });

export { aDeviceProfile };

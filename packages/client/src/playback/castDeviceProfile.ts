import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

/**
 * What every Chromecast plays through its own media player: 1080p H.264 at level 4.1 in eight bits,
 * with stereo AAC. A cast is played by that device, not by the browser sending it, so asking with
 * the browser's own profile could send it HEVC, AV1 or HDR that only the browser can play.
 *
 * @param name - What to call the cast in the session list.
 * @returns What a Chromecast can be sent.
 */
const castDeviceProfile = (name: string): DeviceProfile =>
  DeviceProfileSchema.parse({
    schemaVersion: 1,
    name,
    maxWidth: 1920,
    maxHeight: 1080,
    maxAudioChannels: 2,
    supportedVideoRanges: ['SDR'],
    tenBitVideoCodecs: [],
    maxVideoLevels: { h264: 41 },
    canPlayInterlaced: false,
    supportedSubtitleFormats: ['webvtt'],
    directPlayProfiles: [{ container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac'] }],
    transcodingProfiles: [
      { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
    ],
  });

export { castDeviceProfile };

import { Dimensions, PixelRatio } from 'react-native';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import { describeThisPhone } from '@ValencePhone/platform/describeThisPhone';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';

const EVERY_CHANNEL_IT_DECODES = 8;

const HEVC_LEVEL = 153;

const H264_LEVEL = 52;

/**
 * What this phone can be sent, and what it would rather not be.
 *
 * Declared rather than probed, which is the opposite of what the browser client does and is not a
 * shortcut. A browser will answer questions about codecs — `MediaSource` and the media element both
 * will — and a phone answers none: there is no `canPlayType` in React Native, and what AVFoundation
 * would accept cannot be asked from here without a native module answering for it.
 *
 * So it is stated, and stated conservatively, because the cost of the two mistakes is not equal.
 * Claiming something this phone cannot decode gets a direct play and hands somebody a black picture
 * or silence; claiming less than it can costs a transcode the server was going to be capable of
 * anyway. Everything here is what every iPhone able to run iOS 18 decodes in hardware.
 *
 * AV1 is left out deliberately. It arrived with the A17 Pro, which is a minority of the phones this
 * runs on, and there is no way from here to tell which phone this is — so the ones that have it take
 * a transcode they did not need rather than the ones that do not taking a film they cannot play.
 *
 * Audio is claimed at every channel this phone decodes rather than at the two its speakers have.
 * Asking for two had the server fold six down before sending them, which sounds the same out of
 * the speakers and throws away the only thing headphones could have done something with: a phone
 * handed six channels puts them around somebody wearing AirPods, and a phone handed two has
 * nothing to place. Folding down for the speakers is something iOS does anyway, and it does it
 * knowing what it is playing out of.
 *
 * @returns What to negotiate with.
 */
const thePhonesProfile = (): DeviceProfile => {
  const screen = Dimensions.get('screen');
  const density = PixelRatio.get();

  return DeviceProfileSchema.parse({
    schemaVersion: 1,
    name: describeThisPhone(),
    maxWidth: Math.round(Math.max(screen.width, screen.height) * density),
    maxHeight: Math.round(Math.min(screen.width, screen.height) * density),
    maxAudioChannels: EVERY_CHANNEL_IT_DECODES,
    supportedVideoRanges: ['SDR', 'HDR10', 'HLG'],
    tenBitVideoCodecs: ['hevc'],
    maxVideoLevels: { h264: H264_LEVEL, hevc: HEVC_LEVEL },
    canPlayInterlaced: false,
    unsupportedAudioProfiles: [],
    supportedSubtitleFormats: ['webvtt'],
    directPlayProfiles: [
      { container: 'mp4', videoCodecs: ['h264', 'hevc'], audioCodecs: ['aac', 'ac3', 'eac3'] },
    ],
    transcodingProfiles: [
      { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
    ],
  });
};

export { thePhonesProfile };

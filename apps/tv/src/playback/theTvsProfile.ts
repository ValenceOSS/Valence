import { Platform } from 'react-native';
import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import { say } from '@ValenceI18n/say';
import { whatThisTvPlays } from '@ValenceTv/native/whatThisTvPlays';
import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';
import { whichTv } from '@ValenceTv/native/whichTv';
import type { TvDecoders } from '@ValenceTv/playback/TvDecodersSchema';

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
    name: say('common.appleTV'),
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

const ANDROID_VIDEO = ['h264', 'hevc', 'av1', 'vp9', 'mpeg2'];

const ANDROID_AUDIO = ['aac', 'ac3', 'eac3', 'dts', 'truehd', 'opus', 'flac', 'mp3', 'vorbis'];

const FULL_HD = { width: 1920, height: 1080 };

const WITHOUT_ITS_DECODERS: TvDecoders = {
  video: [
    { codec: 'h264', maxLevel: 41, isTenBit: false, maxWidth: null, maxHeight: null },
    { codec: 'hevc', maxLevel: 120, isTenBit: false, maxWidth: null, maxHeight: null },
  ],
  audio: ['aac', 'mp3', 'opus', 'flac', 'vorbis'],
  passthrough: [],
  hdr: [],
  screen: null,
};

/**
 * What an Android TV plays without help, read from what its own decoders, screen and HDMI output
 * say, since Android televisions are many boxes rather than one and a stick that decodes eight-bit
 * HEVC may not decode ten.
 *
 * A codec is claimed where a decoder takes it, ten bits only where a decoder takes its ten-bit
 * profile, and up to the highest level one decodes. A kind of HDR is claimed where the screen shows
 * it and a decoder takes the ten bits it needs, and Dolby Vision only where there is a Dolby Vision
 * decoder too. Dolby and DTS sound is claimed where the television decodes it or its HDMI output
 * hands it on whole to a receiver. Pictures are sent no larger than the screen. ExoPlayer opens MP4
 * and Matroska alike. Where the television cannot say, it is held to what every Android TV decodes.
 *
 * What it cannot open whole it takes as HLS in transport stream segments rather than fragmented MP4,
 * since the fragments carry the audio encoder's delay as a negative start time, which Android's
 * player refuses.
 *
 * @param plays - What the television says it plays, or nothing where it cannot say.
 * @returns The profile.
 */
const anAndroidTvsProfile = (plays: TvDecoders | null): DeviceProfile => {
  const said = plays ?? WITHOUT_ITS_DECODERS;
  const video = said.video.filter((each) => ANDROID_VIDEO.includes(each.codec));
  const tenBit = video.filter((each) => each.isTenBit).map((each) => each.codec);
  const hasDolbyVision = said.video.some((each) => each.codec === 'dolbyvision');
  const heard = new Set([...said.audio, ...said.passthrough]);
  const screen = said.screen ?? FULL_HD;

  return DeviceProfileSchema.parse({
    schemaVersion: 1,
    name: theKindOfTv(whichTv('android')),
    maxWidth: Math.max(screen.width, FULL_HD.width),
    maxHeight: Math.max(screen.height, FULL_HD.height),
    maxAudioChannels: 8,
    supportedVideoRanges: [
      'SDR',
      ...said.hdr.filter((range) =>
        range === 'DolbyVision' ? hasDolbyVision && tenBit.length > 0 : tenBit.length > 0,
      ),
    ],
    tenBitVideoCodecs: tenBit,
    maxVideoLevels: Object.fromEntries(
      video.flatMap((each) => (each.maxLevel === null ? [] : [[each.codec, each.maxLevel]])),
    ),
    canPlayInterlaced: false,
    supportedSubtitleFormats: ['webvtt'],
    directPlayProfiles: ['mp4', 'mkv'].map((container) => ({
      container,
      videoCodecs: video.map((each) => each.codec),
      audioCodecs: ANDROID_AUDIO.filter((codec) => heard.has(codec)),
    })),
    transcodingProfiles: [
      { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
    ],
  });
};

/**
 * What this television plays without help, which the server reads to decide what it may send as it
 * is and what it has to convert first.
 *
 * @param system - Which system it runs, which is this television's own unless a test says otherwise.
 * @param plays - What an Android TV's own decoders say it plays, read from them unless a test says
 *   otherwise.
 * @returns The profile.
 */
const theTvsProfile = (
  system: typeof Platform.OS = Platform.OS,
  plays: TvDecoders | null = system === 'android' ? whatThisTvPlays() : null,
): DeviceProfile => (system === 'android' ? anAndroidTvsProfile(plays) : anAppleTvsProfile());

export { theTvsProfile };

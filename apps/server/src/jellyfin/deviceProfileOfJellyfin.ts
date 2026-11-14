import { DeviceProfileSchema } from '@ValenceContracts/schemas/DeviceProfile';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { JellyfinDeviceProfile } from '@ValenceServer/jellyfin/JellyfinRequests';

const ANY_VIDEO = ['h264', 'hevc', 'vp9', 'av1'];

const ANY_AUDIO = ['aac', 'mp3', 'ac3', 'eac3', 'opus', 'flac'];

const CONTAINERS: Readonly<Record<string, string>> = { m4v: 'mp4', mpegts: 'ts', matroska: 'mkv' };

const RANGES: Readonly<Record<string, DeviceProfile['supportedVideoRanges'][number]>> = {
  sdr: 'SDR',
  hdr10: 'HDR10',
  hdr10plus: 'HDR10Plus',
  hlg: 'HLG',
  dovi: 'DolbyVision',
  doviwithhdr10: 'DolbyVision',
  doviwithhlg: 'DolbyVision',
  doviwithsdr: 'DolbyVision',
};

const SUBTITLES: Readonly<Record<string, DeviceProfile['supportedSubtitleFormats'][number]>> = {
  srt: 'srt',
  subrip: 'srt',
  vtt: 'webvtt',
  webvtt: 'webvtt',
  ass: 'ass',
  ssa: 'ssa',
  pgssub: 'pgs',
  pgs: 'pgs',
  dvdsub: 'vobsub',
  dvbsub: 'dvbsub',
};

const LARGEST = { width: 3840, height: 2160, channels: 8 };

/**
 * The names in one of Jellyfin's comma-separated lists, in lower case.
 *
 * @param joined - The list as Jellyfin writes it.
 * @returns Its names.
 */
const namesIn = (joined: string | null | undefined): string[] =>
  (joined ?? '')
    .toLowerCase()
    .split(',')
    .map((one) => one.trim())
    .filter((one) => one !== '');

/**
 * The most a codec profile's conditions allow for one property, where one says so.
 *
 * @param profile - The app's profile.
 * @param property - The property, as Jellyfin names it.
 * @returns The limit, or nothing where none is set.
 */
const limitOf = (profile: JellyfinDeviceProfile, property: string): number | null => {
  const limits = (profile.codecprofiles ?? [])
    .filter(
      (codec) =>
        (codec.type ?? 'video').toLowerCase().startsWith('video') || property === 'audiochannels',
    )
    .flatMap((codec) => codec.conditions ?? [])
    .filter(
      (condition) =>
        condition.property?.toLowerCase() === property &&
        condition.condition?.toLowerCase() === 'lessthanequal',
    )
    .map((condition) => Number(condition.value))
    .filter((value) => Number.isFinite(value) && value > 0);

  return limits.length === 0 ? null : Math.min(...limits);
};

/**
 * Which dynamic ranges the app says it shows, from its codec profiles.
 *
 * @param profile - The app's profile.
 * @returns The ranges, which are at least standard dynamic range.
 */
const rangesOf = (profile: JellyfinDeviceProfile): DeviceProfile['supportedVideoRanges'] => {
  const said = (profile.codecprofiles ?? [])
    .flatMap((codec) => codec.conditions ?? [])
    .filter((condition) => condition.property?.toLowerCase() === 'videorangetype')
    .flatMap((condition) => (condition.value ?? '').toLowerCase().split('|'))
    .map((range) => RANGES[range.trim()])
    .filter((range) => range !== undefined);

  return [...new Set(['SDR' as const, ...said])];
};

/**
 * Which codecs the app plays at more than eight bits, which is every one it plays unless a codec
 * profile holds it to eight.
 *
 * @param profile - The app's profile.
 * @param codecs - Every video codec it plays as it is.
 * @returns The codecs it plays at ten bits.
 */
const tenBitOf = (profile: JellyfinDeviceProfile, codecs: readonly string[]): string[] =>
  codecs
    .filter((codec) => codec === 'hevc' || codec === 'av1' || codec === 'vp9')
    .filter(
      (codec) =>
        !(profile.codecprofiles ?? []).some(
          (one) =>
            namesIn(one.codec).includes(codec) &&
            (one.conditions ?? []).some(
              (condition) =>
                condition.property?.toLowerCase() === 'videobitdepth' &&
                Number(condition.value) <= 8,
            ),
        ),
    );

/**
 * What a Jellyfin app can play, said the way Valence's own apps say it, so Valence decides how to
 * play something for it exactly as it decides for them: handed over as it is where the app plays
 * it, and converted into what the app asked for where it does not. An app that sends no profile is
 * taken to play what every current Jellyfin app plays.
 *
 * @param profile - The profile the app sent, where it sent one.
 * @param name - What to call the app.
 * @param maxBitrate - The most the app said it could be sent, in bits a second.
 * @param maxAudioChannels - The most channels the app said it plays.
 * @returns The profile Valence negotiates with.
 */
const deviceProfileOfJellyfin = (
  profile: JellyfinDeviceProfile | null,
  name: string,
  maxBitrate: number | null,
  maxAudioChannels: number | null,
): DeviceProfile => {
  const asked = profile ?? {};
  const direct = (asked.directplayprofiles ?? [])
    .filter((one) => (one.type ?? 'video').toLowerCase() === 'video')
    .flatMap((one) =>
      namesIn(one.container).map((container) => ({
        container: CONTAINERS[container] ?? container,
        videoCodecs: namesIn(one.videocodec).length === 0 ? ANY_VIDEO : namesIn(one.videocodec),
        audioCodecs: namesIn(one.audiocodec).length === 0 ? ANY_AUDIO : namesIn(one.audiocodec),
      })),
    );
  const playsDirectly =
    direct.length === 0
      ? ['mp4', 'mkv', 'webm'].map((container) => ({
          container,
          videoCodecs: ANY_VIDEO,
          audioCodecs: ANY_AUDIO,
        }))
      : direct;
  const converted = (asked.transcodingprofiles ?? [])
    .filter(
      (one) =>
        (one.type ?? 'video').toLowerCase() === 'video' &&
        (one.protocol ?? 'hls').toLowerCase() === 'hls',
    )
    .map((one) => ({
      container: (one.container ?? 'ts').toLowerCase() === 'mp4' ? 'mp4' : 'ts',
      videoCodec: namesIn(one.videocodec)[0] ?? 'h264',
      audioCodec: namesIn(one.audiocodec)[0] ?? 'aac',
      protocol: 'hls' as const,
    }));
  const videoCodecs = [...new Set(playsDirectly.flatMap((one) => one.videoCodecs))];
  const bitrate = maxBitrate ?? asked.maxstreamingbitrate ?? null;
  const subtitles = (asked.subtitleprofiles ?? [])
    .filter((one) => ['embed', 'hls', 'external'].includes((one.method ?? '').toLowerCase()))
    .map((one) => SUBTITLES[(one.format ?? '').toLowerCase()])
    .filter((one) => one !== undefined);

  return DeviceProfileSchema.parse({
    schemaVersion: 1,
    name,
    maxWidth: limitOf(asked, 'width') ?? LARGEST.width,
    maxHeight: limitOf(asked, 'height') ?? LARGEST.height,
    ...(bitrate === null ? {} : { maxBitrateKbps: Math.max(1, Math.floor(bitrate / 1000)) }),
    maxAudioChannels: maxAudioChannels ?? limitOf(asked, 'audiochannels') ?? LARGEST.channels,
    supportedVideoRanges: rangesOf(asked),
    tenBitVideoCodecs: tenBitOf(asked, videoCodecs),
    supportedSubtitleFormats: subtitles.length === 0 ? ['srt', 'webvtt'] : [...new Set(subtitles)],
    directPlayProfiles: playsDirectly,
    transcodingProfiles:
      converted.length === 0
        ? [{ container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' }]
        : converted,
  });
};

export { deviceProfileOfJellyfin };

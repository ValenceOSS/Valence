import type {
  AudioCodec,
  ParsedRelease,
  Resolution,
  VideoCodec,
} from '@ValenceContracts/schemas/ParsedRelease';
import type { ProbedMedia } from '@ValenceRequests/media/ProbedMedia';

const VIDEO_CODECS: Readonly<Record<string, VideoCodec>> = {
  h264: 'h264',
  avc: 'h264',
  hevc: 'h265',
  h265: 'h265',
  vvc: 'h266',
  h266: 'h266',
  av1: 'av1',
  mpeg4: 'xvid',
  msmpeg4v3: 'xvid',
  mpeg2video: 'mpeg2',
};

const LAYOUTS: Readonly<Record<number, string>> = {
  1: '1.0',
  2: '2.0',
  3: '2.1',
  6: '5.1',
  7: '6.1',
  8: '7.1',
};

const AUDIO_CODECS: Readonly<Record<string, AudioCodec>> = {
  truehd: 'truehd',
  dts: 'dts',
  eac3: 'eac3',
  ac3: 'ac3',
  flac: 'flac',
  aac: 'aac',
  opus: 'opus',
  mp3: 'mp3',
  pcm_s16le: 'pcm',
  pcm_s24le: 'pcm',
};

/**
 * The resolution a frame of that size is called, by its height, with the nearest one below taken
 * for anything between — an anamorphic or cropped frame is a few lines short of the name it goes
 * by, and every release calls a 1920x804 film 1080p.
 *
 * @param height - How many lines the frame has.
 * @returns What it is called, or nothing for a frame smaller than any of them.
 */
const resolutionOf = (height: number): Resolution | null => {
  if (height >= 1800) {
    return '2160p';
  }

  if (height >= 900) {
    return '1080p';
  }

  if (height >= 650) {
    return '720p';
  }

  if (height >= 530) {
    return '576p';
  }

  return height >= 400 ? '480p' : null;
};

/**
 * Which DTS this is, since ffprobe calls them all `dts` and says the rest in the profile.
 *
 * @param profile - What the codec calls this encoding.
 * @returns The codec.
 */
const dtsOf = (profile: string | null | undefined): AudioCodec => {
  if (profile === null || profile === undefined) {
    return 'dts';
  }

  if (/\bX\b/i.test(profile)) {
    return 'dtsx';
  }

  return /\bMA\b/i.test(profile) ? 'dtsHdMa' : 'dts';
};

/**
 * What a probe says a file is, in the terms a release name would have used: its resolution, the
 * codec it is in, and the audio on its first track.
 *
 * Where it came from is not among them. A remux and a web download of the same film probe the same,
 * because the difference is in where the bytes came from rather than in the bytes, and only the
 * release name ever knew. Whatever the probe cannot say is left for the name to answer.
 *
 * @param probed - What the transcoder found in the file.
 * @returns The facts, as far as they go.
 */
const qualityFromProbe = (
  probed: ProbedMedia,
): Partial<Pick<ParsedRelease, 'resolution' | 'codec' | 'audio' | 'audioChannels'>> => {
  const video = probed.video ?? null;
  const track = probed.audioStreams[0] ?? null;
  const codec = video === null ? undefined : VIDEO_CODECS[video.codec.toLowerCase()];
  const resolution = video === null ? null : resolutionOf(video.height);
  const named = track === null ? undefined : AUDIO_CODECS[track.codec.toLowerCase()];
  const audio =
    track === null || named === undefined
      ? []
      : [
          ...(named === 'dts' ? [dtsOf(track.profile)] : [named]),
          ...(/atmos/i.test(track.profile ?? '') ? (['atmos'] as const) : []),
        ];

  return {
    ...(resolution === null ? {} : { resolution }),
    ...(codec === undefined ? {} : { codec }),
    ...(audio.length === 0
      ? {}
      : {
          audio,
          ...(track === null || LAYOUTS[track.channels] === undefined
            ? {}
            : { audioChannels: LAYOUTS[track.channels] }),
        }),
  };
};

export { qualityFromProbe };

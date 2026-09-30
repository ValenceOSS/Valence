import { RESOLUTIONS } from '@ValenceContracts/schemas/ParsedRelease';
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
 * The resolution a frame is sold as, from whichever of its sides says more.
 *
 * Height alone undersells a film shot wide: a 4K picture letterboxed to 2.39:1 is 3840 by 1608, and
 * a 1080p one 1920 by 804. So the width is read as well, down to 720p, below which widths are shared
 * across standards and only the height tells them apart.
 *
 * @param width - The frame's width in pixels.
 * @param height - Its height in pixels.
 * @returns The resolution, or null for a frame smaller than any a release is named for.
 */
const resolutionOf = (width: number, height: number): Resolution | null => {
  const byHeight =
    height >= 1800
      ? 0
      : height >= 900
        ? 1
        : height >= 650
          ? 2
          : height >= 530
            ? 3
            : height >= 400
              ? 4
              : null;
  const byWidth = width >= 3200 ? 0 : width >= 1700 ? 1 : width >= 1150 ? 2 : null;
  const best =
    byHeight === null ? byWidth : byWidth === null ? byHeight : Math.min(byHeight, byWidth);

  return best === null ? null : (RESOLUTIONS[best] ?? null);
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
  const resolution = video === null ? null : resolutionOf(video.width, video.height);
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

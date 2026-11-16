import { basename, dirname, extname } from 'node:path';
import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import { releasePartsOf } from './releasePartsOf';
import type { SubtitleVideo } from './SubtitleVideo';

const VIDEO_CODECS: Readonly<Record<string, string>> = {
  h264: 'h264',
  avc: 'h264',
  hevc: 'h265',
  h265: 'h265',
  vvc: 'h266',
  av1: 'av1',
  mpeg2video: 'mpeg2',
};

const AUDIO_CODECS: Readonly<Record<string, string>> = {
  aac: 'aac',
  ac3: 'ac3',
  eac3: 'eac3',
  dts: 'dts',
  truehd: 'truehd',
  flac: 'flac',
  opus: 'opus',
  mp3: 'mp3',
};

/**
 * What a subtitle is matched against for one file, the way Bazarr builds its video: the release
 * parts of the release it came from, where that is known, as Bazarr reads the scene name Radarr or
 * Sonarr kept, then its file name's, then its folder's, with the resolution and codecs the probe
 * found filling in only what the names leave out, as Bazarr's ffprobe refiner does.
 *
 * @param file - The file's path, the release it came from where known, what kind of video it is,
 *   and what the probe found.
 * @returns The video.
 */
const subtitleVideoOf = (file: {
  path: string;
  release?: string | null;
  isEpisode: boolean;
  season: number | null;
  episode: number | null;
  frameRate: number | null;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string | null;
  audioProfile: string | null;
}): SubtitleVideo => {
  const named = releasePartsOf(
    ...(file.release === undefined || file.release === null ? [] : [file.release]),
    basename(file.path, extname(file.path)),
    basename(dirname(file.path)),
  );
  const probedAudio =
    file.audioCodec === null
      ? null
      : file.audioCodec === 'dts' && /\bma\b|master/i.test(file.audioProfile ?? '')
        ? 'dtsHdMa'
        : file.audioCodec.startsWith('pcm')
          ? 'pcm'
          : (AUDIO_CODECS[file.audioCodec] ?? null);

  return {
    kind: file.isEpisode ? 'episode' : 'movie',
    parts: {
      ...named,
      resolution: named.resolution ?? sharpestStepOf(file)?.id ?? null,
      videoCodec: named.videoCodec ?? VIDEO_CODECS[file.videoCodec.toLowerCase()] ?? null,
      audioCodec: named.audioCodec ?? probedAudio,
    },
    season: file.season,
    episode: file.episode,
    frameRate: file.frameRate,
  };
};

export { subtitleVideoOf };

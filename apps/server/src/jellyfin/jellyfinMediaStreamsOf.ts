/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { jellyfinStreamIndexOf } from '@ValenceServer/jellyfin/jellyfinStreamIndexOf';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { JellyfinMediaStream } from '@ValenceServer/jellyfin/JellyfinDtos';

const TEXT_FORMATS: ReadonlySet<string> = new Set(['srt', 'webvtt', 'ass', 'ssa']);

const RANGE_TYPES: Readonly<Record<string, string>> = {
  SDR: 'SDR',
  HDR10: 'HDR10',
  HDR10Plus: 'HDR10Plus',
  HLG: 'HLG',
  DolbyVision: 'DOVI',
};

const SUBTITLE_CODECS: Readonly<Record<string, string>> = {
  srt: 'subrip',
  webvtt: 'webvtt',
  ass: 'ass',
  ssa: 'ssa',
  vobsub: 'dvd_subtitle',
  pgs: 'PGSSUB',
  dvbsub: 'dvb_subtitle',
};

const LAYOUTS: Readonly<Record<number, string>> = { 1: 'mono', 2: 'stereo', 6: '5.1', 8: '7.1' };

/**
 * A stream's name as Jellyfin's apps show it in their track menus: its own title where it has one,
 * and otherwise what it is written in and how.
 *
 * @param parts - What is known about the stream.
 * @returns The name.
 */
const displayTitleOf = (parts: readonly (string | null | undefined)[]): string =>
  parts.filter((part) => part !== null && part !== undefined && part !== '').join(' - ');

/**
 * Every stream in a file as Jellyfin describes them: the picture, each audio track and each
 * subtitle, numbered so the picture is nought and the rest are one past Valence's own index.
 *
 * @param item - The file.
 * @returns Its streams.
 */
const jellyfinMediaStreamsOf = (item: MediaItem): JellyfinMediaStream[] => {
  const range = RANGE_TYPES[item.videoRange] ?? 'SDR';
  const video: JellyfinMediaStream = {
    Codec: item.videoCodec,
    DisplayTitle: displayTitleOf([
      `${item.height.toString()}p`,
      item.videoCodec.toUpperCase(),
      range,
    ]),
    IsDefault: true,
    IsForced: false,
    IsExternal: false,
    Type: 'Video',
    Index: 0,
    Height: item.height,
    Width: item.width,
    BitRate: item.bitrateKbps * 1000,
    BitDepth: item.videoBitDepth,
    VideoRange: item.videoRange === 'SDR' ? 'SDR' : 'HDR',
    VideoRangeType: range,
    IsInterlaced: item.videoIsInterlaced,
    ...(item.videoFrameRate === null || item.videoFrameRate === undefined
      ? {}
      : { AverageFrameRate: item.videoFrameRate, RealFrameRate: item.videoFrameRate }),
    ...(item.videoLevel === null || item.videoLevel === undefined
      ? {}
      : { Level: item.videoLevel }),
  };
  const audio = item.audioStreams.map((stream): JellyfinMediaStream => ({
    Codec: stream.codec,
    ...(stream.language === null || stream.language === undefined
      ? {}
      : { Language: stream.language }),
    ...(stream.title === null || stream.title === undefined ? {} : { Title: stream.title }),
    DisplayTitle: displayTitleOf([
      stream.title ?? stream.language,
      stream.codec.toUpperCase(),
      LAYOUTS[stream.channels] ?? stream.channels.toString(),
    ]),
    IsDefault: stream.isDefault,
    IsForced: false,
    IsExternal: false,
    Type: 'Audio',
    Index: jellyfinStreamIndexOf(stream.index),
    Channels: stream.channels,
    ChannelLayout: LAYOUTS[stream.channels] ?? stream.channels.toString(),
    ...(stream.sampleRate === null || stream.sampleRate === undefined
      ? {}
      : { SampleRate: stream.sampleRate }),
    ...(stream.profile === null || stream.profile === undefined ? {} : { Profile: stream.profile }),
  }));
  const subtitles = item.subtitleStreams.map((stream): JellyfinMediaStream => ({
    Codec: SUBTITLE_CODECS[stream.format] ?? stream.format,
    ...(stream.language === null || stream.language === undefined
      ? {}
      : { Language: stream.language }),
    ...(stream.title === null || stream.title === undefined ? {} : { Title: stream.title }),
    DisplayTitle: displayTitleOf([stream.title ?? stream.language, stream.format.toUpperCase()]),
    IsDefault: false,
    IsForced: stream.isForced,
    IsExternal: false,
    Type: 'Subtitle',
    Index: jellyfinStreamIndexOf(stream.index),
    IsTextSubtitleStream: TEXT_FORMATS.has(stream.format),
    SupportsExternalStream: false,
  }));

  return [video, ...audio, ...subtitles];
};

export { jellyfinMediaStreamsOf };

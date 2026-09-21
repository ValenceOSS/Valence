import { z } from 'zod';

const RESOLUTIONS = ['2160p', '1080p', '720p', '576p', '480p'] as const;

const ResolutionSchema = z.enum(RESOLUTIONS);

const RELEASE_SOURCES = [
  'remux',
  'bluray',
  'webdl',
  'webrip',
  'hdtv',
  'dvd',
  'telesync',
  'cam',
] as const;

const ReleaseSourceSchema = z.enum(RELEASE_SOURCES);

const VIDEO_CODECS = ['h266', 'av1', 'h265', 'h264', 'xvid', 'mpeg2'] as const;

const VideoCodecSchema = z.enum(VIDEO_CODECS);

const HDR_FORMATS = ['dolbyVision', 'hdr10plus', 'hdr10', 'hlg'] as const;

const HdrFormatSchema = z.enum(HDR_FORMATS);

const AUDIO_CODECS = [
  'atmos',
  'truehd',
  'dtsx',
  'dtsHdMa',
  'dts',
  'eac3',
  'ac3',
  'flac',
  'aac',
  'opus',
  'mp3',
  'pcm',
] as const;

const AudioCodecSchema = z.enum(AUDIO_CODECS);

const MUSIC_QUALITIES = [
  'flac24',
  'flac',
  'alac',
  'mp3-320',
  'mp3-v0',
  'aac',
  'opus',
  'mp3-256',
  'mp3-v2',
  'mp3',
] as const;

const MusicQualitySchema = z.enum(MUSIC_QUALITIES);

const ParsedReleaseSchema = z.object({
  title: z.string(),
  year: z.number().int().nullable(),
  seasons: z.array(z.number().int().nonnegative()),
  episodes: z.array(z.number().int().nonnegative()),
  absoluteEpisodes: z.array(z.number().int().positive()),
  airDate: z.string().nullable(),
  isCompleteSeries: z.boolean(),
  resolution: ResolutionSchema.nullable(),
  source: ReleaseSourceSchema.nullable(),
  codec: VideoCodecSchema.nullable(),
  hdr: z.array(HdrFormatSchema),
  audio: z.array(AudioCodecSchema),
  audioChannels: z.string().nullable(),
  musicQuality: MusicQualitySchema.nullable(),
  languages: z.array(z.string()),
  edition: z.string().nullable(),
  group: z.string().nullable(),
  isProper: z.boolean(),
  isRepack: z.boolean(),
});

type Resolution = (typeof RESOLUTIONS)[number];
type ReleaseSource = (typeof RELEASE_SOURCES)[number];
type VideoCodec = (typeof VIDEO_CODECS)[number];
type HdrFormat = (typeof HDR_FORMATS)[number];
type AudioCodec = (typeof AUDIO_CODECS)[number];
type MusicQuality = (typeof MUSIC_QUALITIES)[number];
type ParsedRelease = z.infer<typeof ParsedReleaseSchema>;

export type {
  AudioCodec,
  HdrFormat,
  MusicQuality,
  ParsedRelease,
  ReleaseSource,
  Resolution,
  VideoCodec,
};

export {
  AUDIO_CODECS,
  HDR_FORMATS,
  MUSIC_QUALITIES,
  RELEASE_SOURCES,
  RESOLUTIONS,
  AudioCodecSchema,
  HdrFormatSchema,
  MusicQualitySchema,
  ParsedReleaseSchema,
  ReleaseSourceSchema,
  ResolutionSchema,
  VideoCodecSchema,
};

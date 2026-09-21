import { z } from 'zod';

const AUDIO_QUALITIES = ['lossless', 'high', 'normal', 'low'] as const;

const AudioQualitySchema = z.enum(AUDIO_QUALITIES);

type AudioQuality = z.infer<typeof AudioQualitySchema>;

const AUDIO_QUALITY_KBPS = { high: 320, normal: 160, low: 96 } as const satisfies Record<
  Exclude<AudioQuality, 'lossless'>,
  number
>;

const AUDIO_QUALITY_LABELS: Record<AudioQuality, string> = {
  lossless: 'Lossless',
  high: 'High',
  normal: 'Normal',
  low: 'Data saver',
};

const AUDIO_QUALITY_DETAILS: Record<AudioQuality, string> = {
  lossless: 'The file as it is on the server',
  high: '320 kbps',
  normal: '160 kbps',
  low: '96 kbps',
};

const MusicArtistRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

const MusicAlbumRefSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  hasArtwork: z.boolean(),
});

const MusicArtistSchema = z.object({
  id: z.string().uuid(),
  libraryId: z.string().uuid(),
  name: z.string().min(1),
  hasImage: z.boolean(),
  imageAlbumId: z.string().uuid().nullable(),
  albumCount: z.number().int().nonnegative(),
  trackCount: z.number().int().nonnegative(),
  isFavourite: z.boolean(),
});

const MusicAlbumSchema = z.object({
  id: z.string().uuid(),
  libraryId: z.string().uuid(),
  title: z.string().min(1),
  artist: MusicArtistRefSchema,
  year: z.number().int().nullable(),
  genres: z.array(z.string()),
  hasArtwork: z.boolean(),
  isCompilation: z.boolean(),
  trackCount: z.number().int().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  sizeBytes: z.number().nonnegative().default(0),
  isExplicit: z.boolean().default(false),
  addedAt: z.string(),
});

const MusicTrackSchema = z.object({
  id: z.string().uuid(),
  libraryId: z.string().uuid(),
  title: z.string().min(1),
  artists: z.array(MusicArtistRefSchema),
  album: MusicAlbumRefSchema,
  discNumber: z.number().int().nullable(),
  trackNumber: z.number().int().nullable(),
  durationSeconds: z.number().nonnegative(),
  codec: z.string(),
  isLossless: z.boolean(),
  isExplicit: z.boolean().default(false),
  bitDepth: z.number().int().nullable(),
  sampleRate: z.number().int().nullable(),
  bitrateKbps: z.number().int().nullable(),
  hasLyrics: z.boolean(),
  videoKey: z.string().nullable().default(null),
  isFavourite: z.boolean(),
});

const MusicAlbumDetailSchema = z.object({
  album: MusicAlbumSchema,
  tracks: z.array(MusicTrackSchema),
});

const MusicArtistDetailSchema = z.object({
  artist: MusicArtistSchema,
  albums: z.array(MusicAlbumSchema),
  appearsOn: z.array(MusicAlbumSchema),
  popular: z.array(MusicTrackSchema),
});

const MusicAlbumListSchema = z.object({ albums: z.array(MusicAlbumSchema) });

const MusicArtistListSchema = z.object({ artists: z.array(MusicArtistSchema) });

const MusicTrackListSchema = z.object({ tracks: z.array(MusicTrackSchema) });

const LyricLineSchema = z.object({
  atMs: z.number().int().nonnegative().nullable(),
  text: z.string(),
});

const LyricsSchema = z.object({
  isSynced: z.boolean(),
  lines: z.array(LyricLineSchema),
});

type MusicArtist = z.infer<typeof MusicArtistSchema>;
type MusicAlbum = z.infer<typeof MusicAlbumSchema>;
type MusicTrack = z.infer<typeof MusicTrackSchema>;
type MusicAlbumDetail = z.infer<typeof MusicAlbumDetailSchema>;
type MusicArtistDetail = z.infer<typeof MusicArtistDetailSchema>;
type LyricLine = z.infer<typeof LyricLineSchema>;
type Lyrics = z.infer<typeof LyricsSchema>;

export type {
  AudioQuality,
  LyricLine,
  Lyrics,
  MusicAlbum,
  MusicAlbumDetail,
  MusicArtist,
  MusicArtistDetail,
  MusicTrack,
};

export {
  AUDIO_QUALITIES,
  AUDIO_QUALITY_DETAILS,
  AUDIO_QUALITY_KBPS,
  AUDIO_QUALITY_LABELS,
  AudioQualitySchema,
  LyricLineSchema,
  LyricsSchema,
  MusicAlbumDetailSchema,
  MusicAlbumListSchema,
  MusicAlbumRefSchema,
  MusicAlbumSchema,
  MusicArtistDetailSchema,
  MusicArtistListSchema,
  MusicArtistRefSchema,
  MusicArtistSchema,
  MusicTrackListSchema,
  MusicTrackSchema,
};

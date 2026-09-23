import { z } from 'zod';
import { AudioQualitySchema } from './Music';

const MusicNowPlayingSchema = z.object({
  trackId: z.string().uuid(),
  title: z.string(),
  artists: z.array(z.string()),
  albumId: z.string().uuid(),
  hasArtwork: z.boolean(),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  isPlaying: z.boolean(),
  volume: z.number().min(0).max(1),
  isMuted: z.boolean().default(false),
  quality: AudioQualitySchema.default('lossless'),
  upNext: z.array(z.string().uuid()).max(500).default([]),
  reportedAtMs: z.number().int().nonnegative(),
});

const ListeningSessionSchema = z.object({
  trackId: z.string().uuid(),
  title: z.string(),
  artists: z.array(z.string()),
  albumId: z.string().uuid(),
  hasArtwork: z.boolean(),
  isPlaying: z.boolean(),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  reportedAtMs: z.number().int().nonnegative(),
  quality: AudioQualitySchema,
  delivery: z.enum(['direct', 'encoded']),
  codec: z.string().nullable(),
  kbps: z.number().int().nullable(),
});

const MusicDeviceSchema = z.object({
  clientId: z.string().min(1),
  label: z.string(),
  nowPlaying: MusicNowPlayingSchema.nullable(),
});

const MusicDeviceListSchema = z.object({ devices: z.array(MusicDeviceSchema) });

const MusicCommandSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('play'),
    trackIds: z.array(z.string().uuid()).min(1).max(1000),
    index: z.number().int().nonnegative(),
    positionSeconds: z.number().nonnegative(),
    isPlaying: z.boolean(),
  }),
  z.object({ kind: z.literal('pause') }),
  z.object({ kind: z.literal('resume') }),
  z.object({ kind: z.literal('next') }),
  z.object({ kind: z.literal('previous') }),
  z.object({ kind: z.literal('stop') }),
  z.object({ kind: z.literal('seek'), positionSeconds: z.number().nonnegative() }),
  z.object({ kind: z.literal('volume'), volume: z.number().min(0).max(1) }),
  z.object({ kind: z.literal('mute'), isMuted: z.boolean() }),
  z.object({
    kind: z.literal('enqueue'),
    trackIds: z.array(z.string().uuid()).min(1).max(500),
    where: z.enum(['next', 'last']),
  }),
  z.object({ kind: z.literal('skipTo'), ahead: z.number().int().positive() }),
  z.object({ kind: z.literal('unqueue'), ahead: z.number().int().positive() }),
]);

const ReportNowPlayingSchema = z.object({
  clientId: z.string().min(1).max(120),
  nowPlaying: MusicNowPlayingSchema.nullable(),
});

const SendMusicCommandSchema = z.object({
  fromClientId: z.string().min(1).max(120),
  command: MusicCommandSchema,
});

const PlaybackEventSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('musicCommand'),
    command: MusicCommandSchema,
    fromClientId: z.string(),
    fromLabel: z.string(),
  }),
  z.object({ kind: z.literal('musicDevicesChanged') }),
  z.object({ kind: z.literal('videoDevicesChanged') }),
]);

type MusicNowPlaying = z.infer<typeof MusicNowPlayingSchema>;
type ListeningSession = z.infer<typeof ListeningSessionSchema>;
type MusicDevice = z.infer<typeof MusicDeviceSchema>;
type MusicCommand = z.infer<typeof MusicCommandSchema>;
export type { ListeningSession, MusicCommand, MusicDevice, MusicNowPlaying };

export {
  ListeningSessionSchema,
  MusicCommandSchema,
  MusicDeviceListSchema,
  MusicDeviceSchema,
  MusicNowPlayingSchema,
  PlaybackEventSchema,
  ReportNowPlayingSchema,
  SendMusicCommandSchema,
};

import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';

const LIVE_SOURCE_KINDS = ['stream', 'playlistUrl', 'playlistFile', 'tuner'] as const;

const LiveSourceKindSchema = z.enum(LIVE_SOURCE_KINDS);

const MOST_PLAYLIST_BYTES = 20 * 1024 * 1024;

const LiveAddressSchema = z
  .string()
  .trim()
  .url()
  .max(2000)
  .refine((address) => /^(https?|rtmp|rtsp|udp|rtp):\/\//iu.test(address));

const LiveSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  kind: LiveSourceKindSchema,
  address: z.string().nullable(),
  guideUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  channelCount: z.number().int().nonnegative(),
  refreshedAt: z.string().datetime().nullable(),
  problem: SaidSchema.nullable(),
});

const NewLiveSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('stream'),
    name: z.string().trim().min(1).max(100),
    address: LiveAddressSchema,
    logoUrl: LiveAddressSchema.nullable().default(null),
    guideUrl: LiveAddressSchema.nullable().default(null),
  }),
  z.object({
    kind: z.literal('playlistUrl'),
    name: z.string().trim().min(1).max(100),
    address: LiveAddressSchema,
    guideUrl: LiveAddressSchema.nullable().default(null),
  }),
  z.object({
    kind: z.literal('playlistFile'),
    name: z.string().trim().min(1).max(100),
    playlist: z.string().min(1).max(MOST_PLAYLIST_BYTES),
    guideUrl: LiveAddressSchema.nullable().default(null),
  }),
  z.object({
    kind: z.literal('tuner'),
    name: z.string().trim().min(1).max(100),
    address: LiveAddressSchema,
    guideUrl: LiveAddressSchema.nullable().default(null),
  }),
]);

const LiveChannelSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  number: z.string().nullable(),
  name: z.string(),
  group: z.string().nullable(),
  hasLogo: z.boolean(),
  isFavourite: z.boolean(),
});

const LiveProgrammeSchema = z.object({
  channelId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  title: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  category: z.string().nullable(),
});

const LiveGuideSchema = z.object({
  channels: z.array(LiveChannelSchema),
  programmes: z.array(LiveProgrammeSchema),
});

const LiveSourcesSchema = z.object({ sources: z.array(LiveSourceSchema) });

const LiveStreamSchema = z.object({ manifestUrl: z.string() });

type LiveSourceKind = z.infer<typeof LiveSourceKindSchema>;
type LiveSource = z.infer<typeof LiveSourceSchema>;
type NewLiveSource = z.infer<typeof NewLiveSourceSchema>;
type LiveChannel = z.infer<typeof LiveChannelSchema>;
type LiveProgramme = z.infer<typeof LiveProgrammeSchema>;
type LiveGuide = z.infer<typeof LiveGuideSchema>;
type LiveStream = z.infer<typeof LiveStreamSchema>;

export type {
  LiveChannel,
  LiveGuide,
  LiveProgramme,
  LiveSource,
  LiveSourceKind,
  LiveStream,
  NewLiveSource,
};

export {
  LIVE_SOURCE_KINDS,
  LiveAddressSchema,
  LiveChannelSchema,
  LiveGuideSchema,
  LiveProgrammeSchema,
  LiveSourceKindSchema,
  LiveSourceSchema,
  LiveSourcesSchema,
  LiveStreamSchema,
  MOST_PLAYLIST_BYTES,
  NewLiveSourceSchema,
};

import { z } from 'zod';
import { ClientKindSchema } from './ClientKind';

const VideoNowWatchingSchema = z.object({
  mediaId: z.string().uuid(),
  title: z.string(),
  subtitle: z.string().nullable(),
  hasBackdrop: z.boolean(),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  isPlaying: z.boolean(),
  reportedAtMs: z.number().int().nonnegative(),
});

const VideoDeviceSchema = z.object({
  clientId: z.string().min(1),
  label: z.string(),
  kind: ClientKindSchema.nullable(),
  nowWatching: VideoNowWatchingSchema.nullable(),
});

const VideoDeviceListSchema = z.object({ devices: z.array(VideoDeviceSchema) });

const VideoCommandSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('play'),
    mediaId: z.string().uuid(),
    startSeconds: z.number().nonnegative(),
  }),
  z.object({ kind: z.literal('pause') }),
  z.object({ kind: z.literal('resume') }),
  z.object({ kind: z.literal('seek'), positionSeconds: z.number().nonnegative() }),
  z.object({ kind: z.literal('skip'), seconds: z.number().int().min(-3600).max(3600) }),
  z.object({ kind: z.literal('stop') }),
]);

const ReportNowWatchingSchema = z.object({
  clientId: z.string().min(1).max(120),
  nowWatching: VideoNowWatchingSchema.nullable(),
});

const SendVideoCommandSchema = z.object({
  fromClientId: z.string().min(1).max(120),
  command: VideoCommandSchema,
});

type VideoNowWatching = z.infer<typeof VideoNowWatchingSchema>;
type VideoDevice = z.infer<typeof VideoDeviceSchema>;
type VideoCommand = z.infer<typeof VideoCommandSchema>;

export type { VideoCommand, VideoDevice, VideoNowWatching };

export {
  ReportNowWatchingSchema,
  SendVideoCommandSchema,
  VideoCommandSchema,
  VideoDeviceListSchema,
  VideoDeviceSchema,
  VideoNowWatchingSchema,
};

import { z } from 'zod';
import { ClientKindSchema } from './ClientKind';

const VideoSettingSchema = z.enum(['subtitles', 'audio', 'quality', 'speed']);

const VideoSettingChoicesSchema = z.object({
  setting: VideoSettingSchema,
  chosen: z.string().max(200),
  choices: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        label: z.string().max(200),
        short: z.string().max(40).optional(),
        detail: z.string().max(200).optional(),
        isDisabled: z.boolean().optional(),
      }),
    )
    .max(100),
});

const VideoNowWatchingSchema = z.object({
  mediaId: z.string().uuid(),
  title: z.string(),
  subtitle: z.string().nullable(),
  hasBackdrop: z.boolean(),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  isPlaying: z.boolean(),
  hasNext: z.boolean().default(false),
  stepsBy: z.enum(['episode', 'chapter']).nullable().default(null),
  canStepOn: z.boolean().default(false),
  canStepBack: z.boolean().default(false),
  settings: z.array(VideoSettingChoicesSchema).max(8).default([]),
  skip: z
    .object({ label: z.string().max(120), toSeconds: z.number().nonnegative() })
    .nullable()
    .default(null),
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
    subtitleLanguage: z.string().min(1).max(40).nullable().default(null),
    audioLanguage: z.string().min(1).max(40).nullable().default(null),
  }),
  z.object({ kind: z.literal('pause') }),
  z.object({ kind: z.literal('resume') }),
  z.object({ kind: z.literal('seek'), positionSeconds: z.number().nonnegative() }),
  z.object({ kind: z.literal('skip'), seconds: z.number().int().min(-3600).max(3600) }),
  z.object({ kind: z.literal('next') }),
  z.object({ kind: z.literal('step'), toward: z.enum(['back', 'on']) }),
  z.object({
    kind: z.literal('choose'),
    setting: VideoSettingSchema,
    choiceId: z.string().min(1).max(200),
  }),
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
type VideoSetting = z.infer<typeof VideoSettingSchema>;
type VideoSettingChoices = z.infer<typeof VideoSettingChoicesSchema>;

export type { VideoCommand, VideoDevice, VideoNowWatching, VideoSetting, VideoSettingChoices };

export {
  ReportNowWatchingSchema,
  SendVideoCommandSchema,
  VideoCommandSchema,
  VideoDeviceListSchema,
  VideoDeviceSchema,
  VideoNowWatchingSchema,
  VideoSettingChoicesSchema,
  VideoSettingSchema,
};

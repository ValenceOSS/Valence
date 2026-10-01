import { z } from 'zod';
import {
  REENCODE_MAX_BITRATE_KBPS,
  ReencodeAudioSchema,
  ReencodeCodecSchema,
  ReencodeContainerSchema,
  ReencodeSchema,
} from './Reencode';

const PRE_TRANSCODE_QUALITIES = ['2160p', '1440p', '1080p', '720p', '480p', '360p'] as const;

const PreTranscodeQualitySchema = z.enum(PRE_TRANSCODE_QUALITIES);

const PRE_TRANSCODE_SCHEDULES = ['window', 'untilDone'] as const;

const PreTranscodeScheduleSchema = z.enum(PRE_TRANSCODE_SCHEDULES);

const HourSchema = z.number().int().min(0).max(23);

const PreTranscodingSettingsSchema = z.object({
  isEnabled: z.boolean().default(false),
  isPaused: z.boolean().default(false),
  quality: PreTranscodeQualitySchema.default('1080p'),
  videoCodec: ReencodeCodecSchema.default('h264'),
  container: ReencodeContainerSchema.default('mp4'),
  maxBitrateKbps: z
    .number()
    .int()
    .min(REENCODE_MAX_BITRATE_KBPS.min)
    .max(REENCODE_MAX_BITRATE_KBPS.max)
    .nullable()
    .default(null),
  audio: ReencodeAudioSchema.default('keep'),
  libraryIds: z.array(z.string().uuid()).nullable().default(null),
  schedule: PreTranscodeScheduleSchema.default('window'),
  windowStartHour: HourSchema.default(1),
  windowEndHour: HourSchema.default(6),
});

const PRE_TRANSCODING_DEFAULTS = PreTranscodingSettingsSchema.parse({});

const PreTranscodingStatusSchema = z.object({
  settings: PreTranscodingSettingsSchema,
  copiesMade: z.number().int().nonnegative(),
  stillNeeded: z.number().int().nonnegative(),
  givenUp: z.number().int().nonnegative(),
  current: ReencodeSchema.nullable(),
  isInWindow: z.boolean(),
  timezone: z.string(),
});

type PreTranscodeQuality = z.infer<typeof PreTranscodeQualitySchema>;
type PreTranscodeSchedule = z.infer<typeof PreTranscodeScheduleSchema>;
type PreTranscodingSettings = z.infer<typeof PreTranscodingSettingsSchema>;
type PreTranscodingStatus = z.infer<typeof PreTranscodingStatusSchema>;

export type {
  PreTranscodeQuality,
  PreTranscodeSchedule,
  PreTranscodingSettings,
  PreTranscodingStatus,
};

export {
  PRE_TRANSCODE_QUALITIES,
  PRE_TRANSCODE_SCHEDULES,
  PRE_TRANSCODING_DEFAULTS,
  PreTranscodeQualitySchema,
  PreTranscodeScheduleSchema,
  PreTranscodingSettingsSchema,
  PreTranscodingStatusSchema,
};

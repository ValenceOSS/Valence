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

const MOST_PRE_TRANSCODE_TARGETS = 6;

const PreTranscodeTargetSchema = z.object({
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
});

const DEFAULT_PRE_TRANSCODE_TARGET = PreTranscodeTargetSchema.parse({});

const PreTranscodingSettingsSchema = z.object({
  isEnabled: z.boolean().default(false),
  isPaused: z.boolean().default(false),
  targets: z
    .array(PreTranscodeTargetSchema)
    .min(1)
    .max(MOST_PRE_TRANSCODE_TARGETS)
    .default([DEFAULT_PRE_TRANSCODE_TARGET]),
  keepsOriginal: z.boolean().default(true),
  libraryIds: z.array(z.string().uuid()).nullable().default(null),
  schedule: PreTranscodeScheduleSchema.default('window'),
  windowStartHour: HourSchema.default(1),
  windowEndHour: HourSchema.default(6),
});

const PRE_TRANSCODING_DEFAULTS = PreTranscodingSettingsSchema.parse({});

const PreTranscodeTargetProgressSchema = z.object({
  target: PreTranscodeTargetSchema,
  replacesOriginal: z.boolean(),
  copiesMade: z.number().int().nonnegative(),
  bytesKept: z.number().nonnegative(),
  stillNeeded: z.number().int().nonnegative(),
  givenUp: z.number().int().nonnegative(),
});

const PreTranscodingStatusSchema = z.object({
  settings: PreTranscodingSettingsSchema,
  copiesMade: z.number().int().nonnegative(),
  stillNeeded: z.number().int().nonnegative(),
  givenUp: z.number().int().nonnegative(),
  ladder: z.array(PreTranscodeTargetProgressSchema),
  current: ReencodeSchema.nullable(),
  isInWindow: z.boolean(),
  timezone: z.string(),
});

type PreTranscodeQuality = z.infer<typeof PreTranscodeQualitySchema>;
type PreTranscodeTarget = z.infer<typeof PreTranscodeTargetSchema>;
type PreTranscodeTargetProgress = z.infer<typeof PreTranscodeTargetProgressSchema>;
type PreTranscodeSchedule = z.infer<typeof PreTranscodeScheduleSchema>;
type PreTranscodingSettings = z.infer<typeof PreTranscodingSettingsSchema>;
type PreTranscodingStatus = z.infer<typeof PreTranscodingStatusSchema>;

export type {
  PreTranscodeQuality,
  PreTranscodeTarget,
  PreTranscodeTargetProgress,
  PreTranscodeSchedule,
  PreTranscodingSettings,
  PreTranscodingStatus,
};

export {
  DEFAULT_PRE_TRANSCODE_TARGET,
  MOST_PRE_TRANSCODE_TARGETS,
  PRE_TRANSCODE_QUALITIES,
  PRE_TRANSCODE_SCHEDULES,
  PRE_TRANSCODING_DEFAULTS,
  PreTranscodeQualitySchema,
  PreTranscodeScheduleSchema,
  PreTranscodeTargetSchema,
  PreTranscodeTargetProgressSchema,
  PreTranscodingSettingsSchema,
  PreTranscodingStatusSchema,
};

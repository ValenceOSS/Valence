import { z } from 'zod';

const PLAYBACK_START_REASONS = [
  'opened',
  'next',
  'quality',
  'audio',
  'subtitles',
  'cast',
  'engine',
  'converting',
  'recovering',
  'reconnected',
  'retried',
] as const;

const PlaybackStartReasonSchema = z.enum(PLAYBACK_START_REASONS);

type PlaybackStartReason = z.infer<typeof PlaybackStartReasonSchema>;

export type { PlaybackStartReason };

export { PLAYBACK_START_REASONS, PlaybackStartReasonSchema };

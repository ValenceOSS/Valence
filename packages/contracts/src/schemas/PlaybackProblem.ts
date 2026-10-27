import { z } from 'zod';

const PLAYBACK_PROBLEM_NAMES = [
  'damaged',
  'missing',
  'unreadable',
  'unsupported',
  'unconvertible',
  'unreachable',
  'stopped',
  'converterDown',
  'streamLost',
  'tooManyStreams',
  'signedOut',
  'playerBroke',
  'unknown',
  'downloadMissing',
  'sourceNotReady',
  'sourceLimit',
  'sourceArchive',
  'sourceNoFile',
  'sourceTooBig',
  'sourceUnreachable',
  'sourceNotSetUp',
] as const;

const PlaybackProblemSchema = z.enum(PLAYBACK_PROBLEM_NAMES);

type PlaybackProblem = z.infer<typeof PlaybackProblemSchema>;

type PlaybackProblemGroup =
  | 'file'
  | 'format'
  | 'connection'
  | 'account'
  | 'player'
  | 'download'
  | 'source';

const PLAYBACK_PROBLEMS: Readonly<
  Record<PlaybackProblem, { code: number; group: PlaybackProblemGroup; isPassing: boolean }>
> = {
  damaged: { code: 101, group: 'file', isPassing: false },
  missing: { code: 102, group: 'file', isPassing: false },
  unreadable: { code: 103, group: 'file', isPassing: false },
  unsupported: { code: 201, group: 'format', isPassing: false },
  unconvertible: { code: 202, group: 'format', isPassing: false },
  unreachable: { code: 301, group: 'connection', isPassing: true },
  stopped: { code: 302, group: 'connection', isPassing: false },
  converterDown: { code: 303, group: 'connection', isPassing: false },
  streamLost: { code: 304, group: 'connection', isPassing: true },
  tooManyStreams: { code: 401, group: 'account', isPassing: false },
  signedOut: { code: 402, group: 'account', isPassing: false },
  playerBroke: { code: 501, group: 'player', isPassing: false },
  unknown: { code: 502, group: 'player', isPassing: false },
  downloadMissing: { code: 601, group: 'download', isPassing: false },
  sourceNotReady: { code: 701, group: 'source', isPassing: true },
  sourceLimit: { code: 702, group: 'source', isPassing: false },
  sourceArchive: { code: 703, group: 'source', isPassing: false },
  sourceNoFile: { code: 704, group: 'source', isPassing: false },
  sourceTooBig: { code: 705, group: 'source', isPassing: false },
  sourceUnreachable: { code: 706, group: 'source', isPassing: true },
  sourceNotSetUp: { code: 707, group: 'source', isPassing: false },
};

const PlaybackProblemReportSchema = z.object({
  problem: PlaybackProblemSchema,
  mediaId: z.string().min(1).max(200),
  sessionId: z.string().min(1).max(200).nullable(),
  positionSeconds: z.number().nonnegative().nullable(),
  details: z.string().max(4000),
});

type PlaybackProblemReport = z.infer<typeof PlaybackProblemReportSchema>;

export type { PlaybackProblem, PlaybackProblemGroup, PlaybackProblemReport };

export {
  PLAYBACK_PROBLEM_NAMES,
  PLAYBACK_PROBLEMS,
  PlaybackProblemReportSchema,
  PlaybackProblemSchema,
};

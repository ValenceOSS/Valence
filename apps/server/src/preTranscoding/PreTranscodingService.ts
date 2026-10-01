import type {
  PreTranscodingSettings,
  PreTranscodingStatus,
} from '@ValenceContracts/schemas/PreTranscoding';

type PreTranscodeTick =
  | { kind: 'off' }
  | { kind: 'paused' }
  | { kind: 'outsideTheWindow'; cancelled: number }
  | { kind: 'underWay' }
  | { kind: 'queued'; mediaId: string }
  | { kind: 'nothingLeft' };

type PreTranscodingService = {
  status: () => Promise<PreTranscodingStatus>;
  save: (settings: PreTranscodingSettings) => Promise<PreTranscodingStatus>;
  runNow: (askedBy: string) => Promise<boolean>;
  tick: () => Promise<PreTranscodeTick>;
};

export type { PreTranscodeTick, PreTranscodingService };

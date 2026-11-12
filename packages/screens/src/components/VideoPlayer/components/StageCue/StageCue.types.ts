type StageCueKind = 'toggle' | 'back' | 'forward';

type StageCueProps = {
  cue: { kind: StageCueKind; at: number } | null;
  isPlaying: boolean;
};

export type { StageCueKind, StageCueProps };

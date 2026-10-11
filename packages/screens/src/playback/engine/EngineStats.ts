type EngineStats = {
  gpu: string | null;
  decoder: string | null;
  isSoundCarried: boolean;
  decodedFrames: number;
  drawnFrames: number;
  skippedFrames: number;
  decodedAheadSeconds: number | null;
};

export type { EngineStats };

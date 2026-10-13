import type { HdrSignal } from './HdrSignal';

type EngineStats = {
  route: 'webgpu' | 'remux';
  gpu: string | null;
  hdrSignal: HdrSignal | null;
  isHdrFilm: boolean;
  filmPeakNits: number | null;
  container: string | null;
  sound: 'carried' | 'flac' | 'opus' | 'aac';
  soundChannels: number | null;
  decodedFrames: number;
  drawnFrames: number;
  skippedFrames: number;
  decodedAheadSeconds: number | null;
};

export type { EngineStats };

import type { HdrSignal } from './HdrSignal';

type EngineStats = {
  route: 'webgpu' | 'remux';
  gpu: string | null;
  hdrSignal: HdrSignal | null;
  isHdrFilm: boolean;
  container: string | null;
  sound: 'carried' | 'opus' | 'aac';
  soundChannels: number | null;
  decodedFrames: number;
  drawnFrames: number;
  skippedFrames: number;
  decodedAheadSeconds: number | null;
};

export type { EngineStats };

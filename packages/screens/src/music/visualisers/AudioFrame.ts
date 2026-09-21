type AudioFrame = {
  width: number;
  height: number;
  seconds: number;
  delta: number;
  hue: number;
  bass: number;
  mid: number;
  treble: number;
  spectrum: (bars: number) => number[];
  wave: (points: number) => number[];
};

export type { AudioFrame };

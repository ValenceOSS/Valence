type SpectrumBarsProps = {
  read: (bars: number) => readonly number[];
  isPlaying: boolean;
  bars?: number;
  className?: string;
};

export type { SpectrumBarsProps };

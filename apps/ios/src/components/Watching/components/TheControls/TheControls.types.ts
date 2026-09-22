type TheControlsProps = {
  title: string;
  year: number | null;
  isPlaying: boolean;
  at: number;
  runsFor: number;
  buffered: number;
  onPlayPause: () => void;
  onSkip: (by: number) => void;
  onSeek: (to: number) => void;
  onTouched: () => void;
  onClose: () => void;
  onSettings: () => void;
};

export type { TheControlsProps };

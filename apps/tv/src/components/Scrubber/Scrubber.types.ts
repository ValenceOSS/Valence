type ScrubberProps = {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onFocus?: () => void;
};

export type { ScrubberProps };

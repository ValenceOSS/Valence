type ASystemSliderProps = {
  label: string;
  value: number;
  furthest: number;
  tint: string;
  onScrubbing: (value: number) => void;
  onScrubbed: (value: number) => void;
};

export type { ASystemSliderProps };

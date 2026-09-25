type SliderProps = {
  label: string;
  value: number;
  furthest: number;
  buffered?: number;
  colour: string;
  restColour: string;
  aheadColour: string;
  onScrubbing?: (to: number) => void;
  onScrubbed: (to: number) => void;
};

export type { SliderProps };

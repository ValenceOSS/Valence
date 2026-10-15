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
  isDisabled?: boolean;
  stretches?: readonly { from: number; to: number }[];
  notches?: readonly number[];
  stretchColour?: string;
  notchColour?: string;
};

export type { SliderProps };

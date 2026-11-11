import type { ReactNode } from 'react';

type SliderTone = 'default' | 'overlay' | 'glass' | 'film';

type SliderProps = {
  label: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  onArrowKey?: (direction: 1 | -1) => void;
  onValueChange: (value: number) => void;
  onValueCommit?: (value: number) => void;
  renderPreview?: (value: number) => ReactNode;
  valueLabel?: (value: number) => string;
  tone?: SliderTone;
  isSlim?: boolean;
  isDisabled?: boolean;
  revealsThumb?: boolean;
  stretches?: readonly { from: number; to: number }[];
  notches?: readonly number[];
  className?: string;
};

export type { SliderProps, SliderTone };

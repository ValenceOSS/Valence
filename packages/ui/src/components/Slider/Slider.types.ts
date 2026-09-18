import type { ReactNode } from 'react';

type SliderTone = 'default' | 'overlay' | 'glass';

type SliderProps = {
  label: string;
  value: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  renderPreview?: (value: number) => ReactNode;
  valueLabel?: (value: number) => string;
  tone?: SliderTone;
  isDisabled?: boolean;
  className?: string;
};

export type { SliderProps, SliderTone };

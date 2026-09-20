type RangeSliderProps = {
  label: string;
  thumbLabels: readonly [string, string];
  values: readonly [number, number];
  max: number;
  step?: number;
  valueLabel?: (value: number) => string;
  onValuesChange: (values: [number, number]) => void;
  isDisabled?: boolean;
  className?: string;
};

export type { RangeSliderProps };

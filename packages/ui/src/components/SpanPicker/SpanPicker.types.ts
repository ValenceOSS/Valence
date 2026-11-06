type ChosenSpan = { start: number; end: number };

type SpanPickerProps = {
  values: number[];
  ceiling: number;
  span: ChosenSpan;
  onSpanChange: (span: ChosenSpan) => void;
  label: string;
  tickOf?: (index: number) => string;
  leastSpan?: number;
  className?: string;
};

export type { ChosenSpan, SpanPickerProps };

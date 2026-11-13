import type { ReactNode } from 'react';

type TrendLine = {
  values: (number | null)[];
  colour: string;
};

type TrendChartProps = {
  values: (number | null)[];
  lines?: readonly TrendLine[];
  ceiling: number;
  label: string;
  caption?: ReactNode;
  tipOf?: (index: number) => ReactNode;
  gridLines?: readonly number[];
  tickOf?: (value: number) => string;
  isTall?: boolean;
  fills?: boolean;
  isAnimated?: boolean;
  className?: string;
};

export type { TrendChartProps, TrendLine };

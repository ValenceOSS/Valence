import type { ReactNode } from 'react';

type TrendLine = {
  values: number[];
  colour: string;
};

type TrendChartProps = {
  values: number[];
  lines?: readonly TrendLine[];
  ceiling: number;
  label: string;
  caption?: ReactNode;
  tipOf?: (index: number) => ReactNode;
  gridLines?: readonly number[];
  tickOf?: (value: number) => string;
  isTall?: boolean;
  className?: string;
};

export type { TrendChartProps, TrendLine };

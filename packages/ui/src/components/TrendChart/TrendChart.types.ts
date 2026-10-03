import type { ReactNode } from 'react';

type TrendChartProps = {
  values: number[];
  ceiling: number;
  label: string;
  caption?: ReactNode;
  tipOf?: (index: number) => ReactNode;
  gridLines?: readonly number[];
  tickOf?: (value: number) => string;
  isTall?: boolean;
  className?: string;
};

export type { TrendChartProps };

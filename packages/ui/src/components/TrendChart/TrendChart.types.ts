import type { ReactNode } from 'react';

type TrendChartProps = {
  values: number[];
  ceiling: number;
  label: string;
  caption?: ReactNode;
  className?: string;
};

export type { TrendChartProps };

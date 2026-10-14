import type { ReactNode } from 'react';

type ShareSlice = {
  id: string;
  label: string;
  value: number;
  shown: ReactNode;
};

type ShareChartProps = {
  label: string;
  slices: readonly ShareSlice[];
  total: ReactNode;
  totalLabel: string;
  emptyMessage: string;
};

export type { ShareChartProps, ShareSlice };

import type { ReactNode } from 'react';

type VirtualGridProps = {
  count: number;
  children: (index: number) => ReactNode;
  leastCardWidth: number;
  rowHeight: number;
  gap?: number;
  label?: string;
  className?: string;
};

export type { VirtualGridProps };

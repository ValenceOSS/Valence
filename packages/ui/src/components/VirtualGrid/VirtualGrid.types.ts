import type { ReactNode } from 'react';

type VirtualGridProps = {
  count: number;
  children: (index: number) => ReactNode;
  leastCardWidth: number;
  rowHeight: number;
  gap?: number;
  label?: string;
  isList?: boolean;
  className?: string;
};

export type { VirtualGridProps };

import type { ReactNode } from 'react';

type VirtualStripProps = {
  label: string;
  count: number;
  estimateSize: number;
  startAtIndex?: number;
  onIndexChange?: (index: number) => void;
  onClick?: () => void;
  footer?: ReactNode;
  children: (index: number) => ReactNode;
  className?: string;
};

export type { VirtualStripProps };

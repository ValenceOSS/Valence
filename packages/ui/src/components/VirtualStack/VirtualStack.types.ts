import type { ReactNode } from 'react';

type VirtualStackProps = {
  count: number;
  children: (index: number) => ReactNode;
  keyOf: (index: number) => string;
  estimatedHeight: number;
  gap?: number;
  className?: string;
};

export type { VirtualStackProps };

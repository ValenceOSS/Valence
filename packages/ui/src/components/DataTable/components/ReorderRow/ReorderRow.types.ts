import type { ReactNode } from 'react';

type ReorderRowProps = {
  id: string;
  isReordering: boolean;
  depth: number;
  onDragEnd: () => void;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
};

export type { ReorderRowProps };

import type { ReactNode } from 'react';

type ReorderRowProps = {
  id: string;
  isReordering: boolean;
  depth: number;
  onDragEnd: () => void;
  onClick?: () => void;
  className?: string;
  index?: number;
  measureRef?: (row: HTMLTableRowElement | null) => void;
  children: ReactNode;
};

export type { ReorderRowProps };

import type { ReactNode } from 'react';

type SelectionBarProps = {
  count: number;
  total?: number;
  onSelectAll?: () => void;
  isSelectingAll?: boolean;
  children?: ReactNode;
  onClear: () => void;
  className?: string;
};

export type { SelectionBarProps };

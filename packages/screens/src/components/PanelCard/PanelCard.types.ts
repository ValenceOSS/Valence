import type { ReactNode } from 'react';

type PanelCardProps = {
  title: string;
  actions?: ReactNode;
  below?: ReactNode;
  children: ReactNode;
  isFlush?: boolean;
  isHighlighted?: boolean;
  isCompact?: boolean;
  className?: string;
};

export type { PanelCardProps };

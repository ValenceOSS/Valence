import type { ReactNode } from 'react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type DashboardRegionProps = {
  title: string;
  action?: string;
  onAction?: () => void;
  actionIcon?: IconGlyph;
  isActionBusy?: boolean;
  actions?: ReactNode;
  isFlush?: boolean;
  children: ReactNode;
  className?: string;
};

export type { DashboardRegionProps };

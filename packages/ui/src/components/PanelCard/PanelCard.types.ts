import type { ReactNode } from 'react';
import type { FreshnessNoteProps } from '@ValenceUI/FreshnessNote.types';

type PanelCardProps = {
  title: string;
  actions?: ReactNode;
  freshness?: FreshnessNoteProps;
  below?: ReactNode;
  children: ReactNode;
  isFlush?: boolean;
  isHighlighted?: boolean;
  isCompact?: boolean;
  className?: string;
};

export type { PanelCardProps };

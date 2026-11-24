import type { ReactNode } from 'react';

type RailProps = {
  title: string;
  children: ReactNode;
  count?: number;
  action?: ReactNode;
  onOpenTitle?: () => void;
  titleHref?: string;
  sizesCards?: boolean | undefined;
  cards?: 'wide' | 'portrait' | 'large' | 'poster' | 'library' | undefined;
  hasArrows?: boolean | undefined;
  look?: 'title' | 'section' | undefined;
  className?: string;
};

export type { RailProps };

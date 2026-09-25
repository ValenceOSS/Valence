import type { ReactNode } from 'react';

type ScreenProps = {
  children: ReactNode;
  head?: ReactNode;
  title?: string;
  behind?: ReactNode;
  foot?: ReactNode;
  isSeeThrough?: boolean;
  scrolls?: boolean;
  centres?: boolean;
  onBack?: () => void;
  goesBackDown?: boolean;
  onScrolled?: (isScrolled: boolean) => void;
};

export type { ScreenProps };

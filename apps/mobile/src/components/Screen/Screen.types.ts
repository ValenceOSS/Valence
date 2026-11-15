import type { ReactNode } from 'react';

type ScreenRows = {
  count: number;
  keyOf: (at: number) => string;
  draw: (at: number) => ReactNode;
  apart?: number;
};

type ScreenProps = {
  children: ReactNode;
  head?: ReactNode;
  title?: string;
  behind?: ReactNode;
  foot?: ReactNode;
  corner?: ReactNode;
  isSeeThrough?: boolean;
  scrolls?: boolean;
  centres?: boolean;
  onBack?: () => void;
  goesBackDown?: boolean;
  onScrolled?: (isScrolled: boolean) => void;
  rows?: ScreenRows;
  afterRows?: ReactNode;
};

export type { ScreenProps, ScreenRows };

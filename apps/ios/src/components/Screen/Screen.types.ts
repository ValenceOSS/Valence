import type { ReactNode } from 'react';

type ScreenProps = {
  children: ReactNode;
  head?: ReactNode;
  behind?: ReactNode;
  foot?: ReactNode;
  isSeeThrough?: boolean;
  scrolls?: boolean;
  centres?: boolean;
  onBack?: () => void;
};

export type { ScreenProps };

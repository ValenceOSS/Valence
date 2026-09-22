import type { ReactNode } from 'react';

type ScreenProps = {
  children: ReactNode;
  scrolls?: boolean;
  centres?: boolean;
  onBack?: () => void;
};

export type { ScreenProps };

import type { ReactNode } from 'react';

type ReaderChromeProps = {
  title: string;
  isShown: boolean;
  isRightToLeft: boolean;
  menus: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  onForward: () => void;
  onBack: () => void;
  onClose: () => void;
  className?: string;
};

export type { ReaderChromeProps };

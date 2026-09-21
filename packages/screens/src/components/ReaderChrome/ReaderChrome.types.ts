import type { ReactNode } from 'react';

type ReaderChromeProps = {
  title: string;
  isShown: boolean;
  isRightToLeft: boolean;
  isScrolling?: boolean;
  panel: ReactNode;
  isPanelOpen: boolean;
  isPanelPinned: boolean;
  onPanelOpenChange: (isOpen: boolean) => void;
  footer: ReactNode;
  children: ReactNode;
  onForward: () => void;
  onBack: () => void;
  onClose: () => void;
  className?: string;
};

export type { ReaderChromeProps };

import type { ReactNode } from 'react';

type ReaderChromeProps = {
  title: string;
  place: string | null;
  isShown: boolean;
  isRightToLeft: boolean;
  isScrolling?: boolean;
  actions: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  onForward: () => void;
  onBack: () => void;
  onClose: () => void;
  onToggle: () => void;
  mark?: { isMarked: boolean; onMark: () => void };
  bookmarks?: ReactNode;
  className?: string;
};

export type { ReaderChromeProps };

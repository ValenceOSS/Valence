import type { ReactNode } from 'react';

type ReaderPanelProps = {
  bookTitle: string;
  placeTitle: string | null;
  isPinned: boolean;
  onPinnedChange: (isPinned: boolean) => void;
  onClose: () => void;
  pickers: ReactNode;
  children: ReactNode;
};

export type { ReaderPanelProps };

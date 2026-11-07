import type { ReactNode } from 'react';

type ABottomSheetProps = {
  isOpen: boolean;
  label: string;
  title?: string;
  closeLabel?: string;
  onClose: () => void;
  isTall?: boolean;
  tallest?: number;
  children: ReactNode;
};

export type { ABottomSheetProps };

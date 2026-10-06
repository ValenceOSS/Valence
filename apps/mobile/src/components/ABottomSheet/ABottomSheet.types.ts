import type { ReactNode } from 'react';

type ABottomSheetProps = {
  isOpen: boolean;
  label: string;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export type { ABottomSheetProps };

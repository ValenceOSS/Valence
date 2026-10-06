import type { ReactNode } from 'react';

type ABottomSheetProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export type { ABottomSheetProps };

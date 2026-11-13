import type { ReactNode } from 'react';

type ASheetProps = {
  isOpen: boolean;
  title: string;
  closeLabel?: string;
  onClose: () => void;
  footer?: ReactNode;
  tallest?: number;
  isTitled?: boolean;
  isSteady?: boolean;
  children: ReactNode;
};

export type { ASheetProps };

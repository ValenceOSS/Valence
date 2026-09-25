import type { ReactNode } from 'react';

type ASheetProps = {
  isOpen: boolean;
  title: string;
  closeLabel?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

export type { ASheetProps };

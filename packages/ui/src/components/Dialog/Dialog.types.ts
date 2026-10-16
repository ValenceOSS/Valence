import type { ReactNode } from 'react';

type DialogSize = 'default' | 'stage' | 'drawer';

type DialogProps = {
  label: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: DialogSize;
  isInstant?: boolean;
  className?: string;
};

export type { DialogProps, DialogSize };

import type { ReactNode } from 'react';

type APlayerPanelProps = {
  label: string;
  onClose: () => void;
  children: ReactNode;
  isAlongTheFoot?: boolean;
  isACard?: boolean;
};

export type { APlayerPanelProps };

import type { ReactNode } from 'react';

type APlayerPanelProps = {
  label: string;
  onClose: () => void;
  children: ReactNode;
  isAlongTheFoot?: boolean;
};

export type { APlayerPanelProps };

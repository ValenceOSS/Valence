import type { ReactNode } from 'react';

type TheSidePanelProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

export type { TheSidePanelProps };

import type { ReactNode } from 'react';

type ASidePanelProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

export type { ASidePanelProps };

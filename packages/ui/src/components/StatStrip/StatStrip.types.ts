import type { ReactNode } from 'react';

type StatStripItem = {
  id: string;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  isAlarming?: boolean;
  history?: ReactNode;
};

type StatStripProps = {
  items: readonly StatStripItem[];
  label: string;
  className?: string;
};

export type { StatStripItem, StatStripProps };

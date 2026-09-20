import type { ReactNode } from 'react';

type Stat = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  fraction?: number;
  info?: ReactNode;
};

type StatStripProps = {
  stats: Stat[];
};

export type { Stat, StatStripProps };

import type { ReactNode } from 'react';

type Stat = {
  label: string;
  value: string;
  detail?: string;
  fraction?: number;
  info?: ReactNode;
};

type StatStripProps = {
  stats: Stat[];
};

export type { Stat, StatStripProps };

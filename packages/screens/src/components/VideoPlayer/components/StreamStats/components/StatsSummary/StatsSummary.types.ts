import type { ReactNode } from 'react';

type StatsSummaryItem = {
  label: string;
  value: ReactNode;
};

type StatsSummaryProps = {
  items: readonly StatsSummaryItem[];
};

export type { StatsSummaryItem, StatsSummaryProps };

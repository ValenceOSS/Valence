import type { ReactNode } from 'react';

type ADownloadCardProps = {
  title: string;
  artwork: string | null;
  facts: readonly string[];
  says: string;
  isFailed: boolean;
  fraction: number | null;
  progressLabel: string;
  children: ReactNode;
};

export type { ADownloadCardProps };

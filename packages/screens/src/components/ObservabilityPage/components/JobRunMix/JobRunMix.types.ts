import type { ReactNode } from 'react';

type JobRunMixProps = {
  running?: number;
  completed: number;
  failed: number;
  stopped: number;
  extra?: { label: string; value: ReactNode };
};

export type { JobRunMixProps };

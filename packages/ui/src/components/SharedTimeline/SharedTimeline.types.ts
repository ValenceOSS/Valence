import type { ReactNode } from 'react';

type TimelinePerson = {
  id: string;
  atSeconds: number;
  label: string;
  face: ReactNode;
};

type SharedTimelineProps = {
  label: string;
  durationSeconds: number;
  inSyncSeconds?: number;
  filledSeconds: number;
  people: readonly TimelinePerson[];
  elapsed: string;
  total: string;
  status?: ReactNode;
  className?: string;
};

export type { SharedTimelineProps, TimelinePerson };

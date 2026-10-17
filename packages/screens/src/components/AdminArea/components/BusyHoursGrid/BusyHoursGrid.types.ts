import type { Statistics } from '@ValenceContracts/schemas/Statistics';

type BusyHoursGridProps = {
  hours: readonly (readonly number[])[];
  detail?: Statistics['busyDetail'];
  label: string;
  className?: string;
};

export type { BusyHoursGridProps };

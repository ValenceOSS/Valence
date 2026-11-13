import type { AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';

type DiskUsageCardProps = {
  disks: Monitor['resources']['disks'];
  libraries: readonly Library[];
  cache: Monitor['cache'];
  artwork: AdminOverview['artwork'] | null;
  bookPages: AdminOverview['bookPages'] | null;
};

export type { DiskUsageCardProps };

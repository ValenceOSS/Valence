import type { AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';

type DiskUsageCardProps = {
  disks: Monitor['resources']['disks'];
  libraries: readonly Library[];
  cache: Monitor['cache'];
  artefactRoot: string | null;
  artwork: AdminOverview['artwork'] | null;
  bookPages: AdminOverview['bookPages'] | null;
};

export type { DiskUsageCardProps };

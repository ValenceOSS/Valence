import type { AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';

type StorageInfoProps = {
  cache: Monitor['cache'];
  artwork: AdminOverview['artwork'];
  bookPages: AdminOverview['bookPages'] | null;
  libraryBytes: number | null;
};

export type { StorageInfoProps };

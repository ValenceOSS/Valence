import type { AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { IncomingDownloads } from '@ValenceClient/requests/incomingDownloads';

type CacheBreakdownProps = {
  cache: Monitor['cache'];
  artwork: AdminOverview['artwork'];
  bookPages?: AdminOverview['bookPages'];
  liveSessions: number;
  library: { bytes: number; itemCount: number } | null;
  incoming?: IncomingDownloads | null;
};

export type { CacheBreakdownProps };

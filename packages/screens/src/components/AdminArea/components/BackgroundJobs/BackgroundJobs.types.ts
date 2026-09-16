import type { Monitor } from '@ValenceClient/admin/fetchAdmin';

type BackgroundJobsProps = {
  monitor: Monitor | null;
  isUnreachable?: boolean;
  pageSize?: number;
  growsOnScroll?: boolean;
};

export type { BackgroundJobsProps };

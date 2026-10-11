import type { RecentViewing } from '@ValenceContracts/schemas/RecentViewing';

type HistoryRow = {
  id: string;
  viewing: RecentViewing;
  count: number;
  parts: HistoryRow[];
};

export type { HistoryRow };

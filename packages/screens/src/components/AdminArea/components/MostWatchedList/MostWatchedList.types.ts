import type { Statistics } from '@ValenceContracts/schemas/Statistics';

type MostWatchedListProps = {
  titles: Statistics['topTitles'];
  limit?: number;
};

export type { MostWatchedListProps };

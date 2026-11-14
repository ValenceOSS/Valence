import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type JellyfinViewing = {
  serverId: string;
  progress: ReadonlyMap<string, WatchProgress>;
  favourites: ReadonlySet<string>;
};

export type { JellyfinViewing };

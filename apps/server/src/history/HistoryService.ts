import type { Viewer } from '@ValenceServer/visibility/Viewer';

type Viewing = {
  id: string;
  mediaItemId: string;
  title: string | null;
  seriesTitle: string | null;
  seriesId: string | null;
  startedAt: string;
  lastWatchedAt: string;
  secondsWatched: number;
  isFinished: boolean;
};

type RecentViewing = Viewing & {
  profileId: string;
  profileName: string | null;
  accountId: string | null;
  deviceLabel: string | null;
};

type HistoryService = {
  record: (
    profileId: string,
    mediaItemId: string,
    seen: { at: Date; secondsWatched: number; isFinished: boolean; deviceLabel?: string | null },
  ) => Promise<Viewing | null>;

  recent: (options?: { limit?: number }) => Promise<RecentViewing[]>;

  list: (
    viewer: Viewer,
    profileId: string,
    options?: { limit?: number; offset?: number },
  ) => Promise<Viewing[]>;

  forget: (profileId: string, viewingId: string) => Promise<boolean>;

  forgetAll: (profileId: string) => Promise<number>;

  prune: (before: Date) => Promise<number>;
};

export type { HistoryService, RecentViewing, Viewing };

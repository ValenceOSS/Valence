type PlayCount = {
  trackId: string;
  plays: number;
  lastPlayedAtMs: number;
};

type MusicPlays = {
  record: (profileId: string, trackId: string) => Promise<void>;
  countsSince: (profileId: string, sinceMs: number) => Promise<PlayCount[]>;
};

export type { MusicPlays, PlayCount };

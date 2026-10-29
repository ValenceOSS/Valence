type ReleaseDownloads = {
  tag: string;
  downloads: number;
  publishedAt: string | null;
};

type Downloads = {
  isKnown: boolean;
  total: number;
  releases: ReleaseDownloads[];
};

export type { Downloads, ReleaseDownloads };

type ReleaseDraft = {
  title: string;
  description: string;
  downloadUrl: string | null;
  magnetUrl: string | null;
  infoUrl: string | null;
  infoHash: string | null;
  categories: number[];
  sizeBytes: number | null;
  seeders: number | null;
  leechers: number | null;
  grabs: number | null;
  publishedAt: string | null;
  downloadFactor: number | null;
  uploadFactor: number | null;
  minimumRatio: number | null;
  minimumSeedSeconds: number | null;
};

export type { ReleaseDraft };

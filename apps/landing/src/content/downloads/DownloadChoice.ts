type DownloadChoice = {
  id: 'macAppleSilicon' | 'macIntel' | 'windows' | 'linux';
  system: string;
  detail: string;
  url: string;
  fileName: string | null;
  sizeBytes: number | null;
};

export type { DownloadChoice };

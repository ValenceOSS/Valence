type DownloadChoice = {
  id: 'macAppleSilicon' | 'macIntel' | 'windows' | 'windowsArm' | 'linux' | 'linuxArm';
  system: string;
  detail: string;
  url: string;
  fileName: string | null;
  sizeBytes: number | null;
};

export type { DownloadChoice };

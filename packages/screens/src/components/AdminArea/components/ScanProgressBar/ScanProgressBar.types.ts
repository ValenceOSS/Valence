type ScanProgressBarProps = {
  label: string;
  phase: string | null;
  processed: number | null;
  total: number | null;
  item?: string | null;
};

export type { ScanProgressBarProps };

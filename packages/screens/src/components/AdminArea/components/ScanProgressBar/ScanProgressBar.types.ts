type ScanProgressBarProps = {
  label: string;
  phase: string | null;
  processed: number | null;
  total: number | null;
  item?: string | null;
  isStopping?: boolean;
};

export type { ScanProgressBarProps };

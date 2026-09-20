import type { Job } from '@ValenceClient/admin/fetchAdmin';

type RunningProgress = {
  label: string;
  phase: string | null;
  processed: number | null;
  total: number | null;
};

type RunningWorkDialogProps = {
  title: string;
  isOpen: boolean;
  progress: RunningProgress[];
  tasks: Job[];
  onClose: () => void;
};

export type { RunningWorkDialogProps, RunningProgress };

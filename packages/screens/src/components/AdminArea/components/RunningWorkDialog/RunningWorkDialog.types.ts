import type { Job } from '@ValenceClient/admin/fetchAdmin';

type RunningWorkDialogProps = {
  title: string;
  isOpen: boolean;
  progress: { phase: string | null; processed: number | null; total: number | null } | null;
  tasks: Job[];
  onClose: () => void;
};

export type { RunningWorkDialogProps };

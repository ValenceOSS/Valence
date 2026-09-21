import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';

type JobTraceDialogProps = {
  jobRunId: string | null;
  definitions: JobDefinition[];
  onClose: () => void;
  onOpenInLogs: (jobRunId: string) => void;
  copy?: (text: string) => Promise<void>;
};

export type { JobTraceDialogProps };

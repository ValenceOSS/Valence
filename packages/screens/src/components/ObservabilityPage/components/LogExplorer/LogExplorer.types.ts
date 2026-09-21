import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';

type LogExplorerProps = {
  definitions: JobDefinition[];
  initialJobId?: string | null;
  onInitialJobIdConsumed?: () => void;
  onTraceJob: (jobId: string) => void;
  copy?: (text: string) => Promise<void>;
  download?: (name: string, text: string) => void;
};

export type { LogExplorerProps };

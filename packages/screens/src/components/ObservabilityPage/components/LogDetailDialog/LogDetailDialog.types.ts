import type { LogRecord } from '@ValenceContracts/schemas/Log';

type LogDetailDialogProps = {
  record: LogRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenJob?: (jobId: string) => void;
};

export type { LogDetailDialogProps };

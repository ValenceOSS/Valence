import type { LogRecord } from '@ValenceContracts/schemas/Log';

type LogLineProps = {
  record: LogRecord;
  isExpanded: boolean;
  isWrapped: boolean;
  hasTime: boolean;
  onToggle: () => void;
  onFilter: (filterId: string) => void;
  onOpen: () => void;
  onCopy: () => void;
  onTrace: (jobId: string) => void;
  describeKind: (kind: string) => string;
};

export type { LogLineProps };

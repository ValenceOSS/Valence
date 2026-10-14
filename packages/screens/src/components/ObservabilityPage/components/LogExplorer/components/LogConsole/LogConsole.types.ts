import type { LogRecord } from '@ValenceContracts/schemas/Log';

type LogConsoleProps = {
  records: readonly LogRecord[];
  isWrapped: boolean;
};

export type { LogConsoleProps };

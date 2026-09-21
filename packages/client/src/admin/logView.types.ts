import type { LogRangeId } from './logRanges';
import type { ParsedLogSearch } from './parseLogSearch';
import type { LogLevel, LogSort, LogSource } from '@ValenceContracts/schemas/Log';

type LogView = {
  range: LogRangeId;
  zoom: { fromMs: number; untilMs: number } | null;
  levels: LogLevel[];
  sources: LogSource[];
  jobKinds: string[];
  ids: ParsedLogSearch['ids'];
  search: string;
  sort: LogSort;
  limit: number;
};

export type { LogView };

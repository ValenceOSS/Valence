import type { LogHistogram, LogLevel } from '@ValenceContracts/schemas/Log';

type LevelTogglesProps = {
  histogram: LogHistogram | undefined;
  levels: readonly LogLevel[];
  isReading: boolean;
  onToggle: (level: LogLevel) => void;
};

export type { LevelTogglesProps };

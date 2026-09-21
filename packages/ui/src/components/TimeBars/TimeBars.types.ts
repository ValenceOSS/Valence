type TimeBarsSeries = {
  key: string;
  label: string;
  colour: string;
};

type TimeBarsBar = {
  atMs: number;
  values: Readonly<Record<string, number>>;
};

type TimeBarsProps = {
  bars: readonly TimeBarsBar[];
  series: readonly TimeBarsSeries[];
  bucketMs: number;
  label: string;
  isCompact?: boolean;
  hasLegend?: boolean;
  formatTick: (atMs: number) => string;
  formatSpan?: (fromMs: number, untilMs: number) => string;
  onPickRange?: (fromMs: number, untilMs: number) => void;
  className?: string;
};

export type { TimeBarsBar, TimeBarsProps, TimeBarsSeries };

type TickMeterTone = 'primary' | 'warning' | 'danger';

type TickMeterProps = {
  fraction: number;
  ticks?: number;
  tone?: TickMeterTone;
  className?: string;
};

export type { TickMeterProps, TickMeterTone };

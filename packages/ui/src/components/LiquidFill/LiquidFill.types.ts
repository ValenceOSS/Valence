type LiquidTone = 'success' | 'warning' | 'danger';

type LiquidFillProps = {
  level: number;
  tone: LiquidTone;
  className?: string;
};

type LiquidState = {
  level: number;
  levelSpeed: number;
  heights: number[];
  speeds: number[];
  back: number[];
  backSpeeds: number[];
};

export type { LiquidFillProps, LiquidState, LiquidTone };

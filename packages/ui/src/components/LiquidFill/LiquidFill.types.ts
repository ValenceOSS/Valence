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
  seconds: number;
  phases: number[];
  swell: number[];
  backSwell: number[];
};

type LiquidPen = Pick<
  CanvasRenderingContext2D,
  | 'clearRect'
  | 'beginPath'
  | 'moveTo'
  | 'lineTo'
  | 'quadraticCurveTo'
  | 'closePath'
  | 'fill'
  | 'stroke'
  | 'fillStyle'
  | 'strokeStyle'
  | 'globalAlpha'
  | 'lineWidth'
>;

export type { LiquidFillProps, LiquidPen, LiquidState, LiquidTone };

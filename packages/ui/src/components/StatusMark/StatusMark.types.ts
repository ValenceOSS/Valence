type StatusMarkStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

type StatusMarkProps = {
  status?: StatusMarkStatus;
  progress?: number;
  size?: number;
  strokeWidth?: number;
  dashes?: number;
  spinMilliseconds?: number;
  arcLength?: number;
  className?: string;
};

export type { StatusMarkProps, StatusMarkStatus };

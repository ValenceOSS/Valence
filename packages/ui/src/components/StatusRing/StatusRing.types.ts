type StatusRingStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

type StatusRingProps = {
  status?: StatusRingStatus;
  progress?: number;
  size?: number;
  strokeWidth?: number;
  dashes?: number;
  spinMilliseconds?: number;
  arcLength?: number;
  className?: string;
};

export type { StatusRingProps, StatusRingStatus };

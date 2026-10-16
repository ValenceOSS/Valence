type StatusMarkState = 'loading' | 'idle' | 'progress' | 'done' | 'cancelled' | 'failed';

type StatusMarkProps = {
  state: StatusMarkState;
  progress?: number;
  size?: number;
  label?: string;
  className?: string;
};

export type { StatusMarkProps, StatusMarkState };

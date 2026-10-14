type AStatusMarkState = 'loading' | 'idle' | 'progress' | 'done' | 'cancelled' | 'failed';

type AStatusMarkProps = {
  state: AStatusMarkState;
  colour: string;
  progress?: number;
  size?: number;
  label?: string;
};

export type { AStatusMarkProps, AStatusMarkState };

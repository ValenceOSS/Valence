type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

type SpinnerProps = {
  size?: SpinnerSize;
  label: string;
  className?: string;
};

export type { SpinnerProps, SpinnerSize };

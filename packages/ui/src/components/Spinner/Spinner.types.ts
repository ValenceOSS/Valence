type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

type SpinnerProps = {
  size?: SpinnerSize;
  label: string;
  isCentered?: boolean;
  className?: string;
};

export type { SpinnerProps, SpinnerSize };

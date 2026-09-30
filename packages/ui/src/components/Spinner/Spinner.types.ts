type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

type SpinnerProps = {
  size?: SpinnerSize;
  label: string;
  progress?: number;
  isCentered?: boolean;
  isPageCentered?: boolean;
  className?: string;
};

export type { SpinnerProps, SpinnerSize };

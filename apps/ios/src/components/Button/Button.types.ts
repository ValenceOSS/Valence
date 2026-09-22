import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  onPress: () => void;
  tone?: 'accent' | 'quiet';
  isBusy?: boolean;
  isDisabled?: boolean;
  label?: string;
};

export type { ButtonProps };

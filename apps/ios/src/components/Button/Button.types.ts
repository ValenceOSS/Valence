import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  onPress: () => void;
  tone?: 'accent' | 'quiet' | 'bare';
  isBusy?: boolean;
  isDisabled?: boolean;
  isChosen?: boolean;
  label?: string;
};

export type { ButtonProps };

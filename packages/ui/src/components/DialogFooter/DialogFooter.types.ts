import type { ReactNode } from 'react';

type DialogAnswer = {
  label?: string | undefined;
  onChoose: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
};

type DialogConfirmation = DialogAnswer & {
  label: string;
  isDestructive?: boolean;
};

type DialogFooterProps = {
  children?: ReactNode;
  dismiss?: DialogAnswer;
  confirm?: DialogConfirmation | undefined;
  note?: string | null | undefined;
  className?: string;
};

export type { DialogAnswer, DialogConfirmation, DialogFooterProps };

import type { ReactNode } from 'react';

type DialogAnswer = {
  label?: string | undefined;
  onChoose: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
};

type DialogConfirmation = Omit<DialogAnswer, 'onChoose'> & {
  label: string;
  onChoose?: () => void;
  isSubmit?: boolean;
  isDestructive?: boolean;
};

type DialogFooterProps = {
  children?: ReactNode;
  lead?: ReactNode;
  dismiss?: DialogAnswer;
  confirm?: DialogConfirmation | undefined;
  note?: string | null | undefined;
  className?: string;
};

export type { DialogAnswer, DialogConfirmation, DialogFooterProps };

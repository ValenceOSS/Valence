import type { ReactNode } from 'react';
import type { TitleFieldState } from '@ValenceContracts/schemas/TitleEdit';

type SourcedFieldProps = {
  label: string;
  isLabelHidden?: boolean;
  state: TitleFieldState | undefined;
  onReset: () => void;
  onLock: () => void;
  onUseCatalogue: () => void;
  onShowHistory?: () => void;
  isBusy?: boolean;
  children: ReactNode;
  className?: string;
};

export type { SourcedFieldProps };

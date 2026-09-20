import type { ReactNode } from 'react';
import type { ButtonSize, ButtonVariant } from '@ValenceUI/Button.types';

type FilePickerProps = {
  label: string;
  accept: string;
  onPick: (file: File) => void;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
};

export type { FilePickerProps };

import type { ReactNode } from 'react';
import type { ButtonSize, ButtonVariant } from '@ValenceUI/Button.types';

type FilePickerChoice =
  | { onPick: (file: File) => void; onPickMany?: never; isFolder?: never; isDropZone?: never }
  | {
      onPickMany: (files: File[]) => void;
      isFolder?: boolean;
      isDropZone?: boolean;
      onPick?: never;
    };

type FilePickerProps = FilePickerChoice & {
  label: string;
  accept?: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
};

export type { FilePickerChoice, FilePickerProps };

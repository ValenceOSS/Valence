import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import type { ReactNode } from 'react';

type PressedAt = {
  x: number;
  y: number;
};

type Dismissal = {
  label: string;
  onDismiss: () => void;
};

type ButtonProps = {
  children?: ReactNode;
  onPress?: (at: PressedAt) => void;
  onLongPress?: () => void;
  tone?: 'bold' | 'bright' | 'ghost' | 'quiet' | 'bare';
  icon?: AGlyph;
  fills?: boolean;
  isWide?: boolean;
  isBusy?: boolean;
  isDisabled?: boolean;
  isChosen?: boolean;
  isDestructive?: boolean;
  label?: string;
  dismissal?: Dismissal;
  isOnlyDrawn?: boolean;
};

export type { ButtonProps, Dismissal, PressedAt };

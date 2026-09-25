import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import type { ReactNode } from 'react';

type PressedAt = {
  x: number;
  y: number;
};

type ButtonProps = {
  children?: ReactNode;
  onPress: (at: PressedAt) => void;
  tone?: 'bold' | 'bright' | 'ghost' | 'quiet' | 'bare';
  icon?: AGlyph;
  fills?: boolean;
  isWide?: boolean;
  isBusy?: boolean;
  isDisabled?: boolean;
  isChosen?: boolean;
  isDestructive?: boolean;
  label?: string;
};

export type { ButtonProps, PressedAt };

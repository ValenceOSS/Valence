import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';

type PressedAt = {
  x: number;
  y: number;
};

type ButtonProps = {
  children?: ReactNode;
  onPress: (at: PressedAt) => void;
  tone?: 'accent' | 'bold' | 'bright' | 'ghost' | 'quiet' | 'bare';
  icon?: LucideIcon;
  fills?: boolean;
  isWide?: boolean;
  isBusy?: boolean;
  isDisabled?: boolean;
  isChosen?: boolean;
  label?: string;
};

export type { ButtonProps, PressedAt };

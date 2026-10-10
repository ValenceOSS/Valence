import type { ReactNode } from 'react';

type PopoverPanelProps = {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  heading?: string;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  isDisabled?: boolean;
  isBare?: boolean;
  triggerLook?: 'icon' | 'smallIcon' | 'button' | 'inline';
  tone?: 'default' | 'overlay';
  isOverDialogs?: boolean;
  hasSurface?: boolean;
  className?: string;
};

export type { PopoverPanelProps };

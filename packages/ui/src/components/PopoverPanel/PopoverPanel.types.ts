import type { ReactNode } from 'react';

type PopoverPanelProps = {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  heading?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  isDisabled?: boolean;
  isBare?: boolean;
  triggerLook?: 'icon' | 'smallIcon' | 'button' | 'segment' | 'inline' | 'field';
  tone?: 'default' | 'overlay';
  isOverDialogs?: boolean;
  hasSurface?: boolean;
  offset?: number;
  className?: string;
};

export type { PopoverPanelProps };

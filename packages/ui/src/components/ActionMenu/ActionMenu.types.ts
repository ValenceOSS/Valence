import type { ReactNode } from 'react';

type ActionMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  detail?: string;
  hint?: string;
  isDestructive?: boolean;
  isDisabled?: boolean;
  keepsOpen?: boolean;
  onChoose: () => void;
};

type ActionMenuGroup = {
  name?: string;
  items: ActionMenuItem[];
  control?: ReactNode;
};

type ActionMenuSize = 'sm' | 'md';

type ActionMenuLook = 'plain' | 'face' | 'pill' | 'raised';

type ActionMenuProps = {
  label: string;
  trigger: ReactNode;
  groups: ActionMenuGroup[];
  align?: 'start' | 'center' | 'end';
  size?: ActionMenuSize;
  look?: ActionMenuLook;
  isDisabled?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
};

export type { ActionMenuGroup, ActionMenuItem, ActionMenuLook, ActionMenuProps, ActionMenuSize };

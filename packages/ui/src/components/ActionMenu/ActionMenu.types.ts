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
};

type ActionMenuSize = 'sm' | 'md';

type ActionMenuProps = {
  label: string;
  trigger: ReactNode;
  groups: ActionMenuGroup[];
  align?: 'start' | 'center' | 'end';
  size?: ActionMenuSize;
  isDisabled?: boolean;
  className?: string;
};

export type { ActionMenuGroup, ActionMenuItem, ActionMenuProps, ActionMenuSize };

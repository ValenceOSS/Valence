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

type ActionMenuLook = 'plain' | 'face' | 'raised';

type ActionMenuProps = {
  label: string;
  trigger: ReactNode;
  groups: ActionMenuGroup[];
  align?: 'start' | 'center' | 'end';
  size?: ActionMenuSize;
  look?: ActionMenuLook;
  isDisabled?: boolean;
  className?: string;
};

export type { ActionMenuGroup, ActionMenuItem, ActionMenuLook, ActionMenuProps, ActionMenuSize };

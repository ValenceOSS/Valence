import type { ReactNode } from 'react';

type MenuOption = {
  id: string;
  label: string;
  detail?: string;
};

type OneOfMenuGroup = {
  name: string;
  options: MenuOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

type ManyOfMenuGroup = {
  name: string;
  options: MenuOption[];
  selectedIds: readonly string[];
  lockedIds?: readonly string[];
  onToggle: (id: string, isChosen: boolean) => void;
};

type MenuGroup = OneOfMenuGroup | ManyOfMenuGroup;

type OptionMenuProps = {
  label: string;
  trigger?: ReactNode;
  anchor?: ReactNode;
  groups: MenuGroup[];
  footer?: ReactNode;
  isDisabled?: boolean;
  className?: string;
  align?: 'start' | 'center' | 'end';
  matchTriggerWidth?: boolean;
  size?: 'sm' | 'md';
  triggerShape?:
    | 'icon'
    | 'field'
    | 'fieldJoined'
    | 'segment'
    | 'button'
    | 'quiet'
    | 'confirmJoined'
    | 'secondaryJoined'
    | 'raisedJoined';
};

export type { ManyOfMenuGroup, MenuOption, MenuGroup, OneOfMenuGroup, OptionMenuProps };

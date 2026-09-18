import type { ReactNode } from 'react';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';

type ContextMenuProps = {
  label: string;
  groups: ActionMenuGroup[];
  children: ReactNode;
  isDisabled?: boolean;
  className?: string;
};

export type { ContextMenuProps };

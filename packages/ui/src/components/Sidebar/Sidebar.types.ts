import type { ReactNode } from 'react';
import type { SidebarItem } from '@ValenceUI/SidebarGroup.types';

type SidebarGroupData = {
  label?: string;
  items: readonly SidebarItem[];
};

type SidebarProps = {
  label: string;
  brand?: ReactNode;
  groups: readonly SidebarGroupData[];
  value: string;
  onSelect: (id: string) => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (isCollapsed: boolean) => void;
  footer?: ReactNode;
  className?: string;
};

export type { SidebarProps, SidebarGroupData };

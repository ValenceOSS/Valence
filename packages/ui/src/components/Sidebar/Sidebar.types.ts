import type { ReactNode } from 'react';
import type { SidebarItem } from '@ValenceUI/SidebarGroup.types';

type SidebarGroupData = {
  id?: string;
  isOpen?: boolean;
  label?: string;
  items: readonly SidebarItem[];
};

type SidebarVariant = 'flush' | 'floating';
type SidebarCollapsedVariant = 'hidden' | 'rail';

type SidebarProps = {
  label: string;
  brand?: ReactNode;
  groups: readonly SidebarGroupData[];
  value: string;
  onSelect: (id: string) => void;
  isCollapsed?: boolean;
  collapsedVariant?: SidebarCollapsedVariant;
  onCollapsedChange?: (isCollapsed: boolean) => void;
  onGroupOpenChange?: (id: string, isOpen: boolean) => void;
  footer?: ReactNode;
  variant?: SidebarVariant;
  className?: string;
};

export type { SidebarProps, SidebarGroupData, SidebarCollapsedVariant, SidebarVariant };

import type { IconGlyph } from '@ValenceUI/Icon.types';

type SidebarItem = {
  id: string;
  label: string;
  href?: string;
  icon: IconGlyph;
  activeIcon?: IconGlyph;
  count?: number;
  isUrgent?: boolean;
};

type SidebarGroupProps = {
  label?: string;
  count?: number;
  items: readonly SidebarItem[];
  value: string;
  onSelect: (id: string) => void;
  markGroup: string;
  pointedAt: string | null;
  onPointAt: (id: string | null) => void;
  defaultIsOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  isCollapsed?: boolean;
  className?: string;
};

export type { SidebarGroupProps, SidebarItem };

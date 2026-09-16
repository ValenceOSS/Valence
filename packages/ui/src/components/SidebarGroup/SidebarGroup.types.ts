import type { IconGlyph } from '@ValenceUI/Icon.types';

type SidebarItem = {
  id: string;
  label: string;
  icon: IconGlyph;
};

type SidebarGroupProps = {
  label?: string;
  items: readonly SidebarItem[];
  value: string;
  onSelect: (id: string) => void;
  isRailCollapsed?: boolean;
  defaultIsOpen?: boolean;
  className?: string;
};

export type { SidebarGroupProps, SidebarItem };

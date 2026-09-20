import type { IconGlyph } from '@ValenceUI/Icon.types';

type SidebarItem = {
  id: string;
  label: string;
  icon: IconGlyph;
  activeIcon?: IconGlyph;
};

type SidebarGroupProps = {
  label?: string;
  items: readonly SidebarItem[];
  value: string;
  onSelect: (id: string) => void;
  markGroup: string;
  pointedAt: string | null;
  onPointAt: (id: string | null) => void;
  defaultIsOpen?: boolean;
  className?: string;
};

export type { SidebarGroupProps, SidebarItem };

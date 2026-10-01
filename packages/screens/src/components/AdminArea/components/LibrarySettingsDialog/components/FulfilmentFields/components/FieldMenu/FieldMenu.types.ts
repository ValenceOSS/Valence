import type { MenuOption } from '@ValenceUI/OptionMenu.types';

type FieldMenuProps = {
  label: string;
  options: MenuOption[];
  selectedId: string;
  placeholder: string;
  onSelect: (id: string) => void;
};

export type { FieldMenuProps };

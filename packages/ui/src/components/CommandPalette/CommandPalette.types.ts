type CommandPaletteItem = {
  id: string;
  label: string;
  detail?: string;
};

type CommandPaletteGroup = {
  heading: string;
  items: readonly CommandPaletteItem[];
};

type CommandPaletteProps = {
  label: string;
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  groups: readonly CommandPaletteGroup[];
  onSelect: (id: string) => void;
  placeholder?: string;
  emptyLabel?: string;
};

export type { CommandPaletteGroup, CommandPaletteItem, CommandPaletteProps };

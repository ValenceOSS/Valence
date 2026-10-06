type Setting = {
  id: string;
  label: string;
  value: string;
};

type SettingsMenuProps = {
  title?: string;
  settings: readonly Setting[];
  onOpen: (id: string) => void;
  cameFrom?: string | null;
};

export type { Setting, SettingsMenuProps };

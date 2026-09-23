type Setting = {
  id: string;
  label: string;
  value: string;
};

type SettingsMenuProps = {
  settings: readonly Setting[];
  onOpen: (id: string) => void;
};

export type { Setting, SettingsMenuProps };

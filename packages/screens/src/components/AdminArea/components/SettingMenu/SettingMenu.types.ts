type SettingMenuProps = {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onSelect: (id: string) => void;
  fallback?: string;
};

export type { SettingMenuProps };

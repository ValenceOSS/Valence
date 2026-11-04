type SavedTextProps = {
  label: string;
  saved: string;
  onSave: (value: string) => Promise<boolean>;
  problemOf?: (value: string) => string | null;
  type?: 'text' | 'url';
};

export type { SavedTextProps };

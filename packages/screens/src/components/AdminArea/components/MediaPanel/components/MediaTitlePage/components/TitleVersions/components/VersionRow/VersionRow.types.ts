type VersionRowProps = {
  file: string;
  label: string | null;
  isDefault: boolean;
  isBusy: boolean;
  onLabel: (label: string) => void;
  onDefault: () => void;
  onSplit?: () => void;
};

export type { VersionRowProps };

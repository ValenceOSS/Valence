type FolderFieldProps = {
  label: string;
  value: string;
  onValueChange: (folder: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  isLabelHidden?: boolean;
};

export type { FolderFieldProps };

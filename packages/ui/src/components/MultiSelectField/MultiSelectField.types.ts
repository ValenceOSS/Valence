type MultiSelectOption = {
  id: string;
  label: string;
  isLocked?: boolean;
};

type MultiSelectFieldProps = {
  label: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  description?: string;
  size?: 'sm' | 'md';
  isLabelHidden?: boolean;
  className?: string;
};

export type { MultiSelectFieldProps, MultiSelectOption };
